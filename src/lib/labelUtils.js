export const job_label = (db_label) => {
    if (db_label === "nurse_prn") {
        return "Nurse (PRN)"
    }
    else if (db_label === "nurse_director") {
        return "Nurse (Director)"
    }
    else if (db_label === "caregiver") {
        return "Caregiver"
    }
    else {
        return "Other"
    }
} 