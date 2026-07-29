import { supabase } from './supabase'

export async function getCaregiverByToken(token) {
  const { data, error } = await supabase.functions.invoke('get-caregiver-by-token', {
    body: { token }
  })

  if (error) return null
  return data
}

export async function updateCaregiverStatus(token, status) {
  const { error } = await supabase.functions.invoke('update-caregiver-status', {
    body: { token, status }
  })

  if (error) console.error('Error updating status:', error)
}

export async function saveProgress(caregiverId, companyId, activeStep, completedSteps, formData) {
  const { error } = await supabase
    .from('caregiver_progress')
    .upsert({
      caregiver_id: caregiverId,
      company_id: companyId,
      active_step: activeStep,
      completed_steps: completedSteps,
      form_data: formData,
      last_saved: new Date().toISOString()
    }, {
      onConflict: 'caregiver_id'
    })

  if (error) console.error('Error saving progress:', error)
}

export async function loadProgress(caregiverId) {
  const { data, error } = await supabase
    .from('caregiver_progress')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .maybeSingle()

  if (error) return null
  return data
}

export async function uploadDocument(caregiverId, companyId, caregiverName, documentType, file, expirationDate = null) {
  const fileExt = file.name.split('.').pop()
  const sanitizedName = caregiverName.replace(/[^a-zA-Z0-9]/g, '_')
  const filePath = `${companyId}/${caregiverId}/${sanitizedName}_${documentType}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return null
  }

  const { error: dbError } = await supabase
    .from('caregiver_documents')
    .upsert({
      caregiver_id: caregiverId,
      company_id: companyId,
      document_type: documentType,
      file_name: `${sanitizedName}_${documentType}.${fileExt}`,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      expiration_date: expirationDate || null,
    }, {
      onConflict: 'caregiver_id, document_type'
    })

  if (dbError) {
    console.error('Error saving document record:', dbError)
    return null
  }

  return filePath
}

export async function updateDocumentExpiration(caregiverId, documentType, expirationDate) {
  const { error } = await supabase
    .from('caregiver_documents')
    .update({ expiration_date: expirationDate || null })
    .eq('caregiver_id', caregiverId)
    .eq('document_type', documentType)

  if (error) {
    console.error('Error updating document expiration:', error)
  }
}

export async function getDocuments(caregiverId) {
  const { data, error } = await supabase
    .from('caregiver_documents')
    .select('*')
    .eq('caregiver_id', caregiverId)

  if (error) return []
  return data
}

export async function saveTaxFormData(caregiverId, companyId, formType, data) {
  const updates = { caregiver_id: caregiverId, company_id: companyId }

  if (formType === 'i9') {
    updates.i9_data = {
      lastName: data.lastName,
      firstName: data.firstName,
      middleInitial: data.middleInitial,
      otherLastNames: data.otherLastNames,
      address: data.address,
      apt: data.apt,
      city: data.city,
      state: data.state,
      zip: data.zip,
      email: data.email,
      phone: data.phone,
      citizenshipStatus: data.citizenshipStatus,
      uscisNumber: data.uscisNumber,
      expDate: data.expDate,
      alienNumber: data.alienNumber,
    }
  }

  if (formType === 'w4') {
    updates.w4_data = {
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      cityStateZip: data.cityStateZip,
      filingStatus: data.filingStatus,
      multipleJobs: data.multipleJobs,
      childCredit: data.childCredit,
      otherDependents: data.otherDependents,
      totalCredits: data.totalCredits,
      otherIncome: data.otherIncome,
      deductions: data.deductions,
      extraWithholding: data.extraWithholding,
      exempt: data.exempt,
    }
  }

  if (formType === 'w9') {
    updates.w9_data = {
      name: data.name,
      businessName: data.businessName,
      taxClassification: data.taxClassification,
      llcClassification: data.llcClassification,
      otherDescription: data.otherDescription,
      address: data.address,
      cityStateZip: data.cityStateZip,
    }
  }

  const { error } = await supabase
    .from('caregiver_tax_forms')
    .upsert(updates, { onConflict: 'caregiver_id' })

  if (error) console.error('Error saving tax form data:', error)
}

export async function saveTimeLog(caregiverId, companyId, hoursWorked, sessionStart, completed = false) {
  const { error } = await supabase
    .from('caregiver_time_logs')
    .insert({
      caregiver_id: caregiverId,
      company_id: companyId,
      session_start: sessionStart || new Date().toISOString,
      session_end: new Date().toISOString(),
      active_seconds: Math.round(hoursWorked * 3600),
      completed
    })

  if (error) console.error('Error saving time log:', error)
}

export async function checkpointTimeLog(caregiverId, companyId, token, getHoursWorked, completed = false) {
  const sessionStart = localStorage.getItem(`livi_session_start_${token}`)
  if (!sessionStart) return

  const hoursWorked = getHoursWorked()
  const totalSeconds = Math.round(hoursWorked * 3600)

  try {
    const { data: existingLog } = await supabase
      .from('caregiver_time_logs')
      .select('id')
      .eq('caregiver_id', caregiverId)
      .eq('session_start', sessionStart)
      .maybeSingle()

    if (existingLog) {
      const updates = {
        active_seconds: totalSeconds,
        session_end: new Date().toISOString(),
      }
      if (completed) updates.completed = true

      const { error } = await supabase
        .from('caregiver_time_logs')
        .update(updates)
        .eq('caregiver_id', caregiverId)
        .eq('session_start', sessionStart)

      if (error) console.error('Error saving time log:', error)
    } else {
      await saveTimeLog(caregiverId, companyId, hoursWorked, sessionStart, completed)
    }
  } catch (err) {
    console.error('Error saving time log:', err)
  }
}