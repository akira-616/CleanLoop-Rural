/**
 * Patient Repository
 * Coordinates data operations, persistence, and rule evaluations
 */

import { Patient, VisitRecord, FollowupItem } from '../domain/types';
import {
  initStorage,
  loadAllPatientsFromStorage,
  saveAllPatientsToStorage,
  savePatientToStorage,
} from './storage';
import { getInitialSeedPatients } from './seed';
import { evaluatePatientFlags } from '../domain/rules';
import { evaluateFollowups } from '../domain/followups';
import { enqueueAction } from './syncQueue';

export async function initializeRepository(demoToday: string): Promise<Patient[]> {
  await initStorage();
  const existing = await loadAllPatientsFromStorage();

  if (existing && existing.length > 0) {
    // Re-evaluate flags against current demo reference date
    const updated = existing.map((p) => ({
      ...p,
      current_flag: evaluatePatientFlags(p, demoToday),
    }));
    return updated;
  }

  // Seed default 10 synthetic patients
  const initial = getInitialSeedPatients(demoToday);
  await saveAllPatientsToStorage(initial);
  return initial;
}

export async function resetRepositoryToSeed(demoToday: string): Promise<Patient[]> {
  const seed = getInitialSeedPatients(demoToday);
  await saveAllPatientsToStorage(seed);
  return seed;
}

export async function savePatient(patient: Patient): Promise<void> {
  await savePatientToStorage(patient);
}

/**
 * Adds a new visit to a patient, updates follow-ups, recomputes flags, and queues sync
 */
export async function addPatientVisit(
  patientId: string,
  newVisit: VisitRecord,
  isOnline: boolean,
  demoToday: string
): Promise<{ updatedPatient: Patient; syncQueued: boolean }> {
  const patients = await loadAllPatientsFromStorage();
  const patient = patients.find((p) => p.patient_id === patientId);

  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found`);
  }

  // Combine visits
  const updatedVisits = [...patient.visits, newVisit].sort((a, b) => a.date.localeCompare(b.date));

  // Extract planned follow-ups from the new visit
  const newFollowups: FollowupItem[] = [...patient.followups];

  if (newVisit.planned_followup) {
    const dueDate =
      newVisit.planned_followup.absolute_date ||
      new Date(Date.parse(newVisit.date) + (newVisit.planned_followup.due_in_days || 14) * 86400000)
        .toISOString()
        .slice(0, 10);

    newFollowups.push({
      id: `f_${newVisit.id}_plan`,
      patient_id: patientId,
      kind: 'visit',
      description: newVisit.planned_followup.what || 'Follow-up visit',
      planned_on: newVisit.date,
      due_date: dueDate,
      status: 'open',
      source_visit_id: newVisit.id,
    });
  }

  if (newVisit.tests_ordered) {
    for (let idx = 0; idx < newVisit.tests_ordered.length; idx++) {
      const t = newVisit.tests_ordered[idx];
      const dueDate = new Date(Date.parse(newVisit.date) + (t.due_in_days || 14) * 86400000)
        .toISOString()
        .slice(0, 10);

      newFollowups.push({
        id: `f_${newVisit.id}_test_${idx}`,
        patient_id: patientId,
        kind: 'test',
        description: t.name,
        planned_on: newVisit.date,
        due_date: dueDate,
        status: 'open',
        source_visit_id: newVisit.id,
      });
    }
  }

  if (newVisit.referral) {
    const dueDate = new Date(Date.parse(newVisit.date) + 7 * 86400000).toISOString().slice(0, 10);
    newFollowups.push({
      id: `f_${newVisit.id}_ref`,
      patient_id: patientId,
      kind: 'referral',
      description: `Referral to ${newVisit.referral.to}: ${newVisit.referral.reason || 'Evaluation'}`,
      planned_on: newVisit.date,
      due_date: dueDate,
      status: 'open',
      source_visit_id: newVisit.id,
    });
  }

  // Re-evaluate follow-up statuses
  const evaluatedFollowups = evaluateFollowups(newFollowups, updatedVisits);

  const partialPatient = {
    ...patient,
    visits: updatedVisits,
    followups: evaluatedFollowups,
    updated_at: newVisit.date,
  };

  // Re-evaluate flags
  const newFlag = evaluatePatientFlags(partialPatient, demoToday);

  const finalizedPatient: Patient = {
    ...partialPatient,
    current_flag: newFlag,
  };

  await savePatientToStorage(finalizedPatient);

  // Queue sync
  let syncQueued = false;
  if (!isOnline || newVisit.syncStatus === 'pending') {
    await enqueueAction('CREATE_VISIT', newVisit, patientId);
    syncQueued = true;
  }

  return { updatedPatient: finalizedPatient, syncQueued };
}

/**
 * Doctor manually marks a follow-up item as done
 */
export async function markFollowupDone(
  patientId: string,
  followupId: string,
  demoToday: string,
  isOnline: boolean
): Promise<Patient> {
  const patients = await loadAllPatientsFromStorage();
  const patient = patients.find((p) => p.patient_id === patientId);

  if (!patient) {
    throw new Error(`Patient ${patientId} not found`);
  }

  let updatedItem: FollowupItem | null = null;
  const updatedFollowups = patient.followups.map((f) => {
    if (f.id === followupId) {
      updatedItem = {
        ...f,
        status: 'done' as const,
        completed_on: demoToday,
        completed_reason: 'Doctor manual completion',
      };
      return updatedItem;
    }
    return f;
  });

  const partialPatient = {
    ...patient,
    followups: updatedFollowups,
    updated_at: demoToday,
  };

  const newFlag = evaluatePatientFlags(partialPatient, demoToday);
  const finalizedPatient: Patient = {
    ...partialPatient,
    current_flag: newFlag,
  };

  await savePatientToStorage(finalizedPatient);

  if (updatedItem) {
    await enqueueAction('UPDATE_FOLLOWUP', updatedItem, patientId);
  }

  return finalizedPatient;
}
