const accountSelect = document.querySelector('#account');
const subprocessSelect = document.querySelector('#subprocess');
const locationFilter = document.querySelector('#locationFilter');
const locationPrompt = document.querySelector('#locationPrompt');
const locationPromptSelect = document.querySelector('#locationPromptSelect');
const locationPromptContinue = document.querySelector('#locationPromptContinue');
const candidateLocation = document.querySelector('#candidate-location');
const educationLevel = document.querySelector('#education-level');
const educationOther = document.querySelector('#education-other');
const recruiterSelect = document.querySelector('#recruiter-name');
const recruiterOtherName = document.querySelector('#recruiter-other-name');
const candidateForm = document.querySelector('#candidateForm');
const historyTableBody = document.querySelector('#historyTableBody');
const selectAllHistoryButton = document.querySelector('.select-all-button');
const deleteHistoryButton = document.querySelector('.delete-button');
const assessmentCandidateName = document.querySelector('#assessment-candidate-name');
const assessmentCandidateEmail = document.querySelector('#assessment-candidate-email');
const assessmentSeatFilter = document.querySelector('#assessment-seat-filter');
const runButton = document.querySelector('.run-button');
const historyPreviousPageButton = document.querySelector('#historyPreviousPage');
const historyNextPageButton = document.querySelector('#historyNextPage');
const historyPageStatus = document.querySelector('#historyPageStatus');
const historyPanel = document.querySelector('#historyPanel');
const historyViewToggle = document.querySelector('#historyViewToggle');
const historyMaximizeTip = document.querySelector('#historyMaximizeTip');
const historyScrollTop = document.querySelector('#historyScrollTop');
const historyScrollTopInner = document.querySelector('#historyScrollTopInner');
const historyTableFrame = document.querySelector('#historyTableFrame');
const historyTable = document.querySelector('.history-table');
const topbar = document.querySelector('.topbar');
const syncTopbarSpace = () => {
  const fixed = getComputedStyle(topbar).position === 'fixed';
  document.body.style.paddingTop = fixed ? `${topbar.offsetHeight}px` : '0px';
};

const setLocationPromptVisibility = () => {
  const needsLocation = !locationFilter?.value;
  if (locationPrompt) locationPrompt.hidden = !needsLocation;
  if (needsLocation) locationPromptSelect?.focus();
};

window.addEventListener('portalUnlocked', () => {
  if (new URLSearchParams(window.location.search).has('assessmentOnly')) return;
  if (locationFilter) locationFilter.value = '';
  if (locationPromptSelect) locationPromptSelect.value = '';
  locationFilter?.dispatchEvent(new Event('change', { bubbles: true }));
  setLocationPromptVisibility();
});

locationPromptSelect?.addEventListener('change', () => {
  if (locationFilter && locationPromptSelect.value) {
    locationFilter.value = locationPromptSelect.value;
    locationFilter.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
locationPromptContinue?.addEventListener('click', () => {
  if (!locationPromptSelect?.value) {
    locationPromptSelect?.focus();
    return;
  }
  if (locationFilter) locationFilter.value = locationPromptSelect.value;
  locationFilter?.dispatchEvent(new Event('change', { bubbles: true }));
});

historyViewToggle?.addEventListener('click', () => {
  const isMaximized = historyPanel?.classList.toggle('is-maximized') || false;
  document.body.classList.toggle('endorsement-maximized', isMaximized);
  historyViewToggle.setAttribute('aria-expanded', String(isMaximized));
  historyViewToggle.textContent = isMaximized ? 'Minimize' : 'Maximize';
  historyMaximizeTip?.classList.toggle('is-hidden', isMaximized);
});

const showHistoryMaximizeTip = () => {
  if (!historyPanel?.classList.contains('is-maximized')) historyMaximizeTip?.classList.remove('is-hidden');
};
showHistoryMaximizeTip();
if (window.IntersectionObserver && historyPanel) {
  new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) showHistoryMaximizeTip();
  }, { threshold: 0.2 }).observe(historyPanel);
}

let syncingHistoryScroll = false;
const syncHistoryScrollWidth = () => {
  if (!historyScrollTopInner || !historyTable) return;
  historyScrollTopInner.style.width = `${historyTable.scrollWidth}px`;
};
historyScrollTop?.addEventListener('scroll', () => {
  if (syncingHistoryScroll || !historyTableFrame) return;
  syncingHistoryScroll = true;
  historyTableFrame.scrollLeft = historyScrollTop.scrollLeft;
  syncingHistoryScroll = false;
});
historyTableFrame?.addEventListener('scroll', () => {
  if (syncingHistoryScroll || !historyScrollTop) return;
  syncingHistoryScroll = true;
  historyScrollTop.scrollLeft = historyTableFrame.scrollLeft;
  syncingHistoryScroll = false;
});
if (window.ResizeObserver && historyTable) new ResizeObserver(syncHistoryScrollWidth).observe(historyTable);
window.addEventListener('resize', syncHistoryScrollWidth);
syncHistoryScrollWidth();
syncTopbarSpace();
window.addEventListener('resize', syncTopbarSpace);
if (window.ResizeObserver && topbar) new ResizeObserver(syncTopbarSpace).observe(topbar);
const workdayStatusOptions = ['Review Stage', 'Recruiter Stage', 'Assessment Stage', 'Hiring Manager', 'Offer Stage', 'Internal Assessment', 'Fitment/Offer', 'Declined', 'EIT Movement Issue'];
const HISTORY_STORAGE_KEY = 'endorsementHistoryRows';
const CANDIDATE_DRAFT_STORAGE_KEY = 'endorsementCandidateDraft';
const HISTORY_PAGE_SIZE = 50;
let historyPage = 1;
const SAMPLE_CANDIDATE_NAMES = new Set([
  'Brent Kennedy Baldia Osa', 'Ellen Mae Dianne Naporta', 'Lyka Mae Timario', 'Precious Joy Funa',
  'Maria Mimi Mendoza', 'Hyacinth Mitz Tumangday', 'Arnel Samillano', 'Nefra May Fajardo',
  'Chloe Marie Cortel Lozada', 'Joshua Mark Villanueva', 'Ariana Mae Santos', 'Rafael De Leon',
  'Cassandra Joy Paderna', 'Milo Navarro', 'Nina Verzosa', 'Jude Laurence Dela Cruz'
]);
const removeSampleRows = (rows) => rows.filter((row) => !SAMPLE_CANDIDATE_NAMES.has(String(row?.name || '').trim()));
const formatLocalDate = (date) => `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
const recruitersByLocation = {
  'Iloilo City': [
    'Feye S. Miado', 'Ciarra Mae Imbang', 'Louie Nila Tabares', 'Zaila Dexymae Adricula',
    'Ivy Buenaventura', 'Christian Moncerate', 'Rhyne Adrielle Roxas', 'Vanessa Leumes Samsona',
    'Gian Paula Bilbao', 'Chyd Emanah Salvacion Furio'
  ],
  Bohol: [
    'Chariz Ebido', 'LeofilaJane Cabanig', 'Louie Nila Tabares', 'Divine Grace Alturas',
    'Ivy Mae Cagadas', 'Micah Dela Cerna'
  ],
  Alabang: ['Jonna Espedido', 'Sophia Granzo', 'Nordiolyn Peñalosa'],
  'Quezon City': [
    'Edcel Abalos', 'Gillyn Alliana Natividad', 'Arianna Magbitang', 'Jillianne Balquin',
    'Sarah Santiago', 'Beverly Bautista', 'Sophia Alcantara', 'Jam Deuda',
    'Richelle Novy Gallardo', 'Anne Gonzales', 'Paolo Alvarez', 'Josephine Vicentuan'
  ]
};

const updateRecruiterOptions = () => {
  if (!recruiterSelect) return;
  const currentValue = recruiterSelect.value;
  const location = candidateLocation?.value || '';
  recruiterSelect.innerHTML = '<option selected disabled value="">Select recruiter</option>';
  (recruitersByLocation[location] || []).forEach((recruiter) => {
    const option = document.createElement('option');
    option.value = recruiter;
    option.textContent = recruiter;
    recruiterSelect.appendChild(option);
  });
  if (recruitersByLocation[location]) {
    const otherOption = document.createElement('option');
    otherOption.value = 'Other';
    otherOption.textContent = 'Other';
    recruiterSelect.appendChild(otherOption);
  }
  if ([...recruiterSelect.options].some((option) => option.value === currentValue)) {
    recruiterSelect.value = currentValue;
  }
};

const toggleRecruiterOtherName = () => {
  const isOther = recruiterSelect?.value === 'Other';
  if (recruiterOtherName) {
    recruiterOtherName.hidden = !isOther;
    recruiterOtherName.required = isOther;
    if (!isOther) recruiterOtherName.value = '';
  }
};

const toggleEducationOther = () => {
  const isOther = educationLevel?.value === 'OTHERS';
  if (educationOther) {
    educationOther.hidden = !isOther;
    educationOther.required = isOther;
    if (!isOther) educationOther.value = '';
  }
};

const candidateDraftFields = [
  'workday-name', 'candidate-email', 'candidate-id', 'candidate-status', 'assessment-mode',
  'education-level', 'segment', 'recruiter-name', 'recruiter-other-name', 'account', 'subprocess'
];

const saveCandidateDraft = () => {
  if (!window.localStorage) return;
  const draft = { location: locationFilter?.value || 'All Data' };
  candidateDraftFields.forEach((fieldId) => {
    const field = document.querySelector(`#${fieldId}`);
    if (field) draft[fieldId] = field.value;
  });
  window.localStorage.setItem(CANDIDATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

const restoreCandidateDraft = () => {
  if (!window.localStorage) return;
  let draft;
  try {
    draft = JSON.parse(window.localStorage.getItem(CANDIDATE_DRAFT_STORAGE_KEY) || 'null');
  } catch {
    draft = null;
  }
  if (!draft || typeof draft !== 'object') return;
  if (locationFilter && [...locationFilter.options].some((option) => option.value === draft.location)) {
    locationFilter.value = draft.location;
  }
  if (candidateLocation) candidateLocation.value = !locationFilter?.value || locationFilter.value === 'All Data' ? '' : locationFilter.value;
  candidateDraftFields.forEach((fieldId) => {
    const field = document.querySelector(`#${fieldId}`);
    if (field && fieldId !== 'recruiter-name') field.value = draft[fieldId] || '';
  });
};

const getHistoryCheckboxes = () => [...(historyTableBody?.querySelectorAll('input[type="checkbox"]') || [])];

const saveHistory = () => {
  if (!historyTableBody || !window.localStorage) return;
  const rowData = [...historyTableBody.rows].map((row) => {
    const level2ScoreColumns = ['Spoken Language Assessment', 'English Language Proficiency', 'Typing Score Percentage', 'Basic Computer Literacy']
      .map(getHistoryColumnIndex);
    const level2Scores = level2ScoreColumns
      .map((cellIndex) => row.cells[cellIndex]?.textContent.trim() || '')
      .filter((value) => value !== '' && value !== '-')
      .map(Number)
      .filter((score) => Number.isFinite(score));
    const level2Average = level2Scores.length
      ? String(Math.round(level2Scores.reduce((sum, score) => sum + score, 0) / level2Scores.length))
      : '';
    const level2ScoreCell = row.cells[getHistoryColumnIndex('Overall Matching Score Level 2')];
    const level2StatusCell = row.cells[getHistoryColumnIndex('Overall Matching Status Level 2')];
    if (level2ScoreCell) level2ScoreCell.textContent = level2Average;
    if (level2StatusCell) level2StatusCell.textContent = level2Average === '' ? '' : (Number(level2Average) >= 50 ? 'Good Fit' : 'Poor Fit');
    const getHeaderValue = (headerText) => {
      const index = getHistoryColumnIndex(headerText);
      return index >= 0 ? (row.cells[index]?.textContent.trim() || '') : '';
    };
    const candidateIdInput = row.querySelector('.candidate-id-table-input');
    const remarksInput = row.querySelector('.assessment-remarks-input');
    const remarksCell = row.querySelector('.assessment-remarks-cell');
    const dateSeatInput = row.querySelector('.date-seat-input');
    const workdayStatusSelect = row.querySelector('.workday-status-select');
    return {
      id: candidateIdInput?.value || getHeaderValue('ID Number') || '-',
      name: getHeaderValue('Name') || '',
      email: getHeaderValue('Email') || '',
      location: getHeaderValue('Location') || '',
      status: getHeaderValue('Candidate Status') || '',
      mode: getHeaderValue('Assessment Mode') || '',
      education: getHeaderValue('Education') || '',
      segment: getHeaderValue('Segment') || '',
      account: getHeaderValue('Account') || '',
      subprocess: getHeaderValue('Account Subprocess') || '',
      recruiter: getHeaderValue('Name of Recruiter') || '',
      overallStatus: getHeaderValue('Overall Matching Status Level 1') || '-',
      level1Status: row.querySelector('[data-admin-label="LEVEL 1"]')?.textContent.trim() || '-',
      overallMatchingScore: getHeaderValue('Overall Matching Score Level 1') || '-',
      situationalJudgement: getHeaderValue('Situational Judgement Test (Global)') || '-',
      logicalReasoning: getHeaderValue('Logical Reasoning') || '-',
      customerSupportPersonality: getHeaderValue('Customer Support Personality') || '-',
      claimsSupportMatch: getHeaderValue('Claims Support Match') || '-',
      salesSupportMatch: getHeaderValue('Sales Support Match') || '-',
      medicalAdministrationSupport: getHeaderValue('Medical Administration Support') || '-',
      multitasking: getHeaderValue('Multitasking') || '-',
      learningAttitude: getHeaderValue('Learning Attitude') || '-',
      empathy: getHeaderValue('Empathy') || '-',
      overallMatchingStatusLevel2: getHeaderValue('Overall Matching Status Level 2') || '-',
      level2Status: row.querySelector('[data-admin-label="LEVEL 2"]')?.textContent.trim() || '-',
      overallMatchingScoreLevel: getHeaderValue('Overall Matching Score Level 2') || '-',
      spokenLanguageAssessment: getHeaderValue('Spoken Language Assessment') || '-',
      spokenLanguageProficiency1: getHeaderValue('Pronunciation') || '-',
      spokenLanguageProficiency2: getHeaderValue('Read aloud') || '-',
      spokenLanguageProficiency3: getHeaderValue('Listen and repeat') || '-',
      cefrLevel: getHeaderValue('CEFR Level') || '-',
      standardEnglishLanguage: getHeaderValue('English Language Proficiency') || '-',
      vocabulary: getHeaderValue('Vocabulary') || '-',
      grammar: getHeaderValue('Grammar') || '-',
      comprehension: getHeaderValue('Comprehension') || '-',
      typingSpeed: getHeaderValue('Typing Speed') || '-',
      typingScorePercentage: getHeaderValue('Typing Score Percentage') || '-',
      standardComputerProficiency: getHeaderValue('Basic Computer Literacy') || '-',
      customizedPhilippinesOncology: getHeaderValue('Oncology') || '-',
      customizedPhilippinesAnatomy: getHeaderValue('Anatomy') || '-',
      labCorpAssessment: getHeaderValue('Data Entry') || '-',
      customizedPhilippinesClinical: getHeaderValue('Clinical Acumen') || '-',
      customizedPhilippinesRegistered: getHeaderValue('Registered Nursing Test') || '-',
      spanishLatamProficiency: getHeaderValue('Spanish LATAM Proficiency') || '-',
      dateSeat: dateSeatInput?.value || '',
      remarks: remarksInput?.value || remarksCell?.textContent.trim() || '',
      workdayStatus: workdayStatusSelect?.value || ''
    };
  });
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(rowData));
  window.firebaseSync?.saveRows(rowData);
};

const loadHistory = () => {
  if (!historyTableBody || !window.localStorage) return false;
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, '[]');
    return true;
  }
  try {
    const parsedRows = JSON.parse(raw);
    if (!Array.isArray(parsedRows)) {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, '[]');
      return true;
    }
    const savedRows = removeSampleRows(parsedRows);
    if (savedRows.length !== parsedRows.length) window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(savedRows));
    const selectedNames = new Set([...historyTableBody.rows]
      .filter((row) => row.querySelector('input[type="checkbox"]')?.checked)
      .map((row) => row.cells[getHistoryColumnIndex('Name')]?.textContent.trim())
      .filter(Boolean));
    historyTableBody.innerHTML = '';
    savedRows.forEach((candidate, index) => {
      if (!candidate.level1Status && /^(PASSED|FAILED)$/i.test(candidate.overallStatus || '')) {
        const score = Number(candidate.overallMatchingScore);
        candidate.overallStatus = Number.isFinite(score) ? (score >= 50 ? 'Good Fit' : 'Poor Fit') : '-';
      }
      if (!candidate.level2Status && /^(PASSED|FAILED)$/i.test(candidate.overallMatchingStatusLevel2 || '')) {
        const score = Number(candidate.overallMatchingScoreLevel);
        candidate.overallMatchingStatusLevel2 = Number.isFinite(score) ? (score >= 50 ? 'Good Fit' : 'Poor Fit') : '-';
      }
      const row = createHistoryRow(candidate, index + 1);
      const dateSeatInput = row.querySelector('.date-seat-input');
      const candidateIdInput = row.querySelector('.candidate-id-table-input');
      const remarksInput = row.querySelector('.assessment-remarks-input');
      const remarksCell = row.querySelector('.assessment-remarks-cell');
      const workdayStatusSelect = row.querySelector('.workday-status-select');
      if (dateSeatInput) dateSeatInput.value = candidate.dateSeat || '';
      if (candidateIdInput) candidateIdInput.value = candidate.id === '-' ? '' : (candidate.id || '');
      if (remarksInput) remarksInput.value = candidate.remarks || '';
      if (remarksCell && !remarksInput) remarksCell.textContent = candidate.remarks || '-';
      if (workdayStatusSelect) workdayStatusSelect.value = candidate.workdayStatus || '';
      const selectionCheckbox = row.querySelector('input[type="checkbox"]');
      if (selectionCheckbox) selectionCheckbox.checked = selectedNames.has(candidate.name);
      const updateWorkdayStatusColor = () => {
        workdayStatusSelect.closest('td')?.setAttribute('data-status', workdayStatusSelect.value.toLowerCase());
      };
      workdayStatusSelect?.addEventListener('change', updateWorkdayStatusColor);
      updateWorkdayStatusColor();
      historyTableBody.appendChild(row);
    });
    refreshAssessmentNames();
    updateHistoryActions();
      applyHistoryFilters();
    return true;
  } catch (error) {
    console.error('Failed to load saved history', error);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, '[]');
    return true;
  }
};

window.getLocalHistoryRows = () => {
  try {
    const savedRows = JSON.parse(window.localStorage?.getItem(HISTORY_STORAGE_KEY) || '[]');
    return Array.isArray(savedRows) ? savedRows : [];
  } catch {
    return [];
  }
};

let historyDebounceTimer = null;
const isUserEditingHistoryCell = () => {
  const active = document.activeElement;
  return !!(active && active.closest && active.closest('.date-seat-input, .candidate-id-table-input, .workday-status-select, .assessment-remarks-input'));
};

const syncActiveFieldFromRemote = (savedRows) => {
  const active = document.activeElement;
  if (!active || !active.closest) return false;
  const row = active.closest('tr');
  if (!row || !historyTableBody) return false;
  const rowIndex = [...historyTableBody.rows].indexOf(row);
  if (rowIndex < 0 || !savedRows[rowIndex]) return false;
  return true;
};

const updateHistoryActions = () => {
  const checkboxes = getHistoryCheckboxes();
  const allSelected = checkboxes.length > 0 && checkboxes.every((checkbox) => checkbox.checked);
  const hasSelection = checkboxes.some((checkbox) => checkbox.checked);
  checkboxes.forEach((checkbox) => checkbox.closest('tr')?.classList.toggle('history-row-selected', checkbox.checked));
  if (selectAllHistoryButton) selectAllHistoryButton.textContent = allSelected ? 'Clear All' : 'Select All';
  if (deleteHistoryButton) deleteHistoryButton.disabled = !hasSelection;
};

const renumberHistoryRows = () => {
  [...(historyTableBody?.rows || [])].forEach((row, index) => {
    const numberCell = row.cells[getHistoryColumnIndex('#')];
    if (numberCell) numberCell.textContent = String(index + 1);
  });
};

const queueHistorySave = () => {
  clearTimeout(historyDebounceTimer);
  historyDebounceTimer = window.setTimeout(() => {
    saveHistory();
  }, 250);
};

const updateHistoryPagination = (matchingRows) => {
  const pageCount = Math.max(1, Math.ceil(matchingRows.length / HISTORY_PAGE_SIZE));
  historyPage = Math.min(historyPage, pageCount);
  const firstVisibleIndex = (historyPage - 1) * HISTORY_PAGE_SIZE;
  matchingRows.forEach((row, index) => { row.hidden = index < firstVisibleIndex || index >= firstVisibleIndex + HISTORY_PAGE_SIZE; });
  if (historyPageStatus) historyPageStatus.textContent = `Page ${historyPage} of ${pageCount} (${matchingRows.length} records)`;
  if (historyPreviousPageButton) historyPreviousPageButton.disabled = historyPage <= 1;
  if (historyNextPageButton) historyNextPageButton.disabled = historyPage >= pageCount;
};

const getDateSeatMonth = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return '';
  return `${match[3]}-${match[1].padStart(2, '0')}`;
};

const applyHistoryFilters = ({ resetPage = false } = {}) => {
  if (resetPage) historyPage = 1;
  const filters = {
    nameEmail: document.querySelector('#historySearch')?.value.trim().toLowerCase() || '',
    location: document.querySelector('#historyLocation')?.value.trim().toLowerCase() || '',
    selectedLocation: document.querySelector('#locationFilter')?.value.trim().toLowerCase() || '',
    account: document.querySelector('#historyAccount')?.value.trim().toLowerCase() || '',
    status: document.querySelector('#historyStatus')?.value.trim().toLowerCase() || '',
    dateSeat: document.querySelector('#historyDateSeat')?.value.trim().toLowerCase() || '',
    month: document.querySelector('#historyMonth')?.value || ''
  };
  const allRows = [...(historyTableBody?.rows || [])];
  allRows.forEach((row) => { row.hidden = true; });
  const matchingRows = allRows.filter((row) => {
    const value = (header) => row.cells[getHistoryColumnIndex(header)]?.textContent.trim().toLowerCase() || '';
    const locationAndWorkdayStatus = `${value('Location')} ${row.querySelector('.workday-status-select')?.value.trim().toLowerCase() || ''}`;
    return (!filters.nameEmail || `${value('Name')} ${value('Email')}`.includes(filters.nameEmail))
      && (!filters.location || locationAndWorkdayStatus.includes(filters.location))
      && (!filters.selectedLocation || filters.selectedLocation === 'all data' || value('Location') === filters.selectedLocation)
      && (!filters.account || `${value('Account')} ${value('Account Subprocess')}`.includes(filters.account))
      && (!filters.status || `${value('Candidate Status')} ${value('Assessment Mode')}`.includes(filters.status))
      && (!filters.dateSeat || row.querySelector('.date-seat-input')?.value.trim().toLowerCase().includes(filters.dateSeat))
      && (!filters.month || getDateSeatMonth(row.querySelector('.date-seat-input')?.value) === filters.month);
  });
  updateHistoryPagination(matchingRows);
};

['#historySearch', '#historyLocation', '#historyAccount', '#historyStatus', '#historyDateSeat', '#historyMonth'].forEach((selector) => {
  document.querySelector(selector)?.addEventListener('input', () => applyHistoryFilters({ resetPage: true }));
  document.querySelector(selector)?.addEventListener('change', () => applyHistoryFilters({ resetPage: true }));
});
document.querySelector('#locationFilter')?.addEventListener('change', () => applyHistoryFilters({ resetPage: true }));
historyPreviousPageButton?.addEventListener('click', () => { if (historyPage > 1) { historyPage -= 1; applyHistoryFilters(); } });
historyNextPageButton?.addEventListener('click', () => { historyPage += 1; applyHistoryFilters(); });
locationFilter?.addEventListener('change', () => {
  if (candidateLocation) candidateLocation.value = !locationFilter.value || locationFilter.value === 'All Data' ? '' : locationFilter.value;
  updateRecruiterOptions();
  toggleRecruiterOtherName();
  refreshAssessmentNames();
  saveCandidateDraft();
  setLocationPromptVisibility();
});
candidateForm?.addEventListener('input', saveCandidateDraft);
candidateForm?.addEventListener('change', saveCandidateDraft);
educationLevel?.addEventListener('change', toggleEducationOther);
restoreCandidateDraft();
if (candidateLocation && locationFilter) {
  candidateLocation.value = !locationFilter.value || locationFilter.value === 'All Data' ? '' : locationFilter.value;
}
updateRecruiterOptions();
restoreCandidateDraft();
toggleEducationOther();
  recruiterSelect?.addEventListener('mousedown', (event) => {
    if (!locationFilter?.value || locationFilter.value === 'All Data') {
      event.preventDefault();
      window.alert('Please choose a location first.');
      locationFilter.focus();
    }
  });
recruiterSelect?.addEventListener('change', toggleRecruiterOtherName);
toggleRecruiterOtherName();
if (!document.body.classList.contains('assessment-only')) {
  if (locationPromptSelect && locationFilter?.value && locationFilter.value !== 'All Data') locationPromptSelect.value = locationFilter.value;
  setLocationPromptVisibility();
}

window.applyRemoteHistoryRows = (savedRows) => {
  if (!Array.isArray(savedRows) || !historyTableBody) return;
  const cleanedRows = removeSampleRows(savedRows);
  const localSnapshot = window.localStorage?.getItem(HISTORY_STORAGE_KEY);
  const remoteSnapshot = JSON.stringify(cleanedRows);
  const remoteWasCleaned = cleanedRows.length !== savedRows.length;
  if (localSnapshot === remoteSnapshot && !remoteWasCleaned) return;
  window.localStorage?.setItem(HISTORY_STORAGE_KEY, remoteSnapshot);
  if (isUserEditingHistoryCell()) {
    syncActiveFieldFromRemote(savedRows);
    return;
  }
  loadHistory();
  if (remoteWasCleaned) saveHistory();
  refreshLevel1ThresholdStatuses();
};

selectAllHistoryButton?.addEventListener('click', () => {
  const checkboxes = getHistoryCheckboxes();
  const shouldSelect = checkboxes.some((checkbox) => !checkbox.checked);
  checkboxes.forEach((checkbox) => { checkbox.checked = shouldSelect; });
  updateHistoryActions();
});

deleteHistoryButton?.addEventListener('click', () => {
  getHistoryCheckboxes()
    .filter((checkbox) => checkbox.checked)
    .forEach((checkbox) => checkbox.closest('tr')?.remove());
  renumberHistoryRows();
  refreshAssessmentNames();
  assessmentCandidateName?.dispatchEvent(new Event('change'));
  updateHistoryActions();
  saveHistory();
});

historyTableBody?.addEventListener('change', (event) => {
  updateHistoryActions();
  if (event?.target?.matches?.('input[type="checkbox"]')) return;
  saveHistory();
});
historyTableBody?.addEventListener('blur', (event) => {
  const target = event?.target;
  if (!target || !target.matches) return;
  if (target.matches('.date-seat-input, .candidate-id-table-input, .assessment-remarks-input, .workday-status-select')) {
    saveHistory();
  }
}, true);
historyTableBody?.addEventListener('input', () => {
  queueHistorySave();
});

const normalizeSeatFilterValue = (value) => String(value ?? '').trim().toLowerCase().replace(/^seat\s*/i, '').trim();

const matchesSeatFilter = (seatText, filterValue) => {
  const normalizedFilter = normalizeSeatFilterValue(filterValue);
  if (!normalizedFilter) return true;

  const seatEntries = String(seatText ?? '')
    .toLowerCase()
    .replace(/^seat\s*/i, '')
    .split(/[^0-9a-z]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const exactTextMatch = seatEntries.some((entry) => entry === normalizedFilter);
  if (exactTextMatch) return true;

  const numericFilter = normalizedFilter.replace(/\D+/g, '');
  if (!numericFilter) return false;

  const numericSeatMatches = (String(seatText ?? '').match(/\d+/g) || []).map((value) => value.trim());
  return numericSeatMatches.some((value) => value === numericFilter);
};

const refreshAssessmentNames = () => {
  if (!assessmentCandidateName) return;
  const currentValue = assessmentCandidateName.value;
  const seatFilterValue = normalizeSeatFilterValue(assessmentSeatFilter?.value);
  const activeLocation = locationFilter?.value || 'All Data';
  assessmentCandidateName.innerHTML = '<option selected disabled value="">Select candidate name</option>';
  [...(historyTableBody?.rows || [])].forEach((row, rowIndex) => {
    const name = row.cells[getHistoryColumnIndex('Name')]?.textContent.trim();
    const rowLocation = row.cells[getHistoryColumnIndex('Location')]?.textContent.trim() || '';
    const seatText = row.querySelector('.date-seat-input')?.value || row.cells[getHistoryColumnIndex('Date/Seat')]?.textContent.trim() || '';
    const matchesLocation = activeLocation === 'All Data' || rowLocation === activeLocation;
    const matchesSeat = matchesSeatFilter(seatText, seatFilterValue);
    if (!name || !matchesLocation || !matchesSeat) return;
    const option = document.createElement('option');
    option.value = String(rowIndex);
    option.textContent = name;
    assessmentCandidateName.appendChild(option);
  });
  if ([...assessmentCandidateName.options].some((option) => option.value === currentValue)) {
    assessmentCandidateName.value = currentValue;
  } else {
    assessmentCandidateName.value = '';
  }
  updateAssessmentEmail();
};

const updateAssessmentEmail = () => {
  if (!assessmentCandidateEmail) return;
  const selectedRowIndex = Number(assessmentCandidateName?.value);
  const matchingRow = Number.isInteger(selectedRowIndex) ? historyTableBody?.rows[selectedRowIndex] : null;
  assessmentCandidateEmail.value = matchingRow?.cells[getHistoryColumnIndex('Email')]?.textContent.trim() || '';
};

assessmentCandidateName?.addEventListener('change', updateAssessmentEmail);
assessmentSeatFilter?.addEventListener('input', refreshAssessmentNames);

const scoreFields = [
  ['overallMatchingScore', ['Overall Matching Score', 'Matching Score']],
  ['situationalJudgement', ['Situational Judgement Test (Global)']],
  ['logicalReasoning', ['Logical Reasoning']],
  ['customerSupportPersonality', ['Customer Support Personality']],
  ['claimsSupportMatch', ['Claims Support Match']],
  ['salesSupportMatch', ['Sales Support Match']],
  ['medicalAdministrationSupport', ['Medical Administration Support Match', 'Medical Administration Support']],
  ['multitasking', ['Multitasking']],
  ['learningAttitude', ['Learning Attitude']],
  ['empathy', ['Empathy']]
];

const findScore = (text, labels) => {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`\\b${escapedLabel}\\b(?:\\s*\\([^)]*\\))?\\s*(?:[:\\-]|\\/|\\n)?\\s*(\\d{1,3})\\s*%?`, 'i'),
      new RegExp(`\\b${escapedLabel}\\b(?:\\s*\\([^)]*\\))?\\s*(?:[:\\-]|\\/)\\s*(\\d{1,3})\\s*%?`, 'i'),
      new RegExp(`\\b(\\d{1,3})\\s*%\\s*(?:${escapedLabel}|${escapedLabel}\\s*\\([^)]*\\))`, 'i'),
      new RegExp(`${escapedLabel}\\b(?:\\s*\\([^)]*\\))?\\s*(?:[.,;]|$)\\s*(\\d{1,3})\\s*%?`, 'i')
    ];
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) return match[1] || '';
    }
  }
  return '';
};

const findValue = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
};

const findProficiencyScore = (text, proficiencyName) => {
  const escapedName = proficiencyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  const patterns = [
    new RegExp(`(?:Spoken\\s+Language\\s+Proficiency\\s*(?:[—-]|:|/)?\\s*)?${escapedName}(?:\\s*\\(English\\))?\\s*(?:[:\\-]|\\/)\\s*(\\d{1,3})(?:\\s*%)?`, 'i'),
    new RegExp(`(?:Spoken\\s+Language\\s+Proficiency\\s*(?:[—-]|:|/)?\\s*)?${escapedName}(?:\\s*\\(English\\))?\\s*(\\d{1,3})(?:\\s*%)?`, 'i'),
    new RegExp(`(?:Spoken\\s+Language\\s+Proficiency\\s*(?:[—-]|:|/)?\\s*)?${escapedName}\\s*[:\\-]?\\s*(\\d{1,3})(?:\\s*%)?`, 'i')
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) return match[1] || '';
  }

  return '';
};

const getLevel2Average = (pastedResults, typingScoreOverride = '') => {
  const typingScore = typingScoreOverride || findValue(pastedResults, [
    /([0-9]{1,3})\s*%\s*Typing Skills/i,
    /Typing Skills\s*(?:Overall\s*)?([0-9]{1,3})\s*%/i,
    /Typing Assessment[\s\S]{0,160}?Overall\s+([0-9]{1,3})\s*%/i
  ]);
  const scoreValues = [
    findScore(pastedResults, ['Spoken Language Assessment']),
    findScore(pastedResults, ['English Language Proficiency', 'Standard English Language']),
    typingScore,
    findScore(pastedResults, ['Basic Computery Literacy', 'Basic Computer Literacy', 'Standard Computer Proficiency', 'Computer Proficiency'])
  ];
  const scores = scoreValues
    .map((value) => String(value).trim())
    .filter((value) => /^\d{1,3}$/.test(value))
    .map(Number)
    .filter((score) => Number.isFinite(score));
  return scores.length ? String(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)) : '';
};

const findLevel3Score = (text, labels) => {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`(\\d{1,3})\\s*%\\s*(?:AR-\\s*)?${escapedLabel}`, 'i'),
      new RegExp(`(?:AR-\\s*)?${escapedLabel}.*?(?:[:\\-]|/)\\s*(\\d{1,3})\\s*%?`, 'i'),
      new RegExp(`(?:AR-\\s*)?${escapedLabel}.*?(\\d{1,3})\\s*%\\s*Overall\\s+Score`, 'i'),
      new RegExp(`(?:AR-\\s*)?${escapedLabel}[\\s\\S]{0,100}?(\\d{1,3})\\s*%\\s*Matching\\s+Score`, 'i')
    ];
    for (let index = 0; index < lines.length; index += 1) {
      const line = [lines[index - 1], lines[index], lines[index + 1]].filter(Boolean).join(' ');
      if (!new RegExp(`(?:AR-\\s*)?${escapedLabel}`, 'i').test(line)) continue;
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) return match[1] || '';
      }
    }
  }
  return '';
};

const updateRowCells = (row, values, columnByKey) => {
  Object.entries(columnByKey).forEach(([key, cellIndex]) => {
    if (values[key] && cellIndex >= 0 && row.cells[cellIndex]) row.cells[cellIndex].textContent = values[key];
  });
};

const getHistoryColumnIndex = (headerText) => [...document.querySelectorAll('.history-table thead tr:not(.column-letter-row) th')]
  .findIndex((header) => header.textContent.trim() === headerText);

const normalizeMappingValue = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const getThresholdRows = () => {
  try {
    const savedWorkbook = window.thresholdWorkbookDataOverride || JSON.parse(window.localStorage.getItem('thresholdWorkbookData') || '[]');
    return savedWorkbook.flatMap((sheet) => Array.isArray(sheet.rows)
      ? sheet.rows.map((row) => ({ headers: sheet.headers || [], values: row || [] }))
      : []);
  } catch {
    return [];
  }
};

window.applyRemoteThresholdWorkbook = (savedWorkbook) => {
  if (!Array.isArray(savedWorkbook)) return;
  window.thresholdWorkbookDataOverride = savedWorkbook;
  window.localStorage?.setItem('thresholdWorkbookData', JSON.stringify(savedWorkbook));
  window.localStorage?.setItem('thresholdWorkbookUpdatedAt', String(Date.now()));
  window.dispatchEvent(new Event('thresholdWorkbookUpdated'));
  refreshLevel1ThresholdStatuses();
};

window.addEventListener('message', (event) => {
  if (event.data?.type !== 'thresholdWorkbookData') return;
  window.thresholdWorkbookDataOverride = event.data.workbook;
  window.localStorage?.setItem('thresholdWorkbookData', JSON.stringify(event.data.workbook));
  window.dispatchEvent(new Event('thresholdWorkbookUpdated'));
  refreshLevel1ThresholdStatuses();
});

const applyLevel1Threshold = (row) => {
  const thresholdRows = getThresholdRows();
  if (!thresholdRows.length) return '';
  const subprocess = row.cells[getHistoryColumnIndex('Account Subprocess')]?.textContent || '';
  const account = row.cells[getHistoryColumnIndex('Account')]?.textContent || '';
  const getThresholdValue = (threshold, header) => threshold.values[threshold.headers.findIndex((item) => normalizeMappingValue(item) === normalizeMappingValue(header))];
  const subprocessMatches = thresholdRows.filter((threshold) => normalizeMappingValue(getThresholdValue(threshold, 'Account Subprocess')) === normalizeMappingValue(subprocess));
  const matchingThreshold = subprocessMatches.find((threshold) => normalizeMappingValue(getThresholdValue(threshold, 'Account')) === normalizeMappingValue(account)) || subprocessMatches[0];
  if (!matchingThreshold) {
    row.querySelector('[data-admin-label="LEVEL 1"]')?.replaceChildren();
    return '';
  }
  return applyThresholdStatus(row, matchingThreshold, [
    ['Overall Matching Score Level 1', 'Overall Matching Score Level 1'],
    ['Situational Judgement Test (Global)', 'Situational Judgement Test (Global)'],
    ['Logical Reasoning', 'Logical Reasoning'],
    ['Customer Support Personality', 'Customer Support Personality'],
    ['Claims Support Match', 'Claims Support Match'],
    ['Sales Support Match', 'Sales Support Match'],
    ['Medical Administration Support', 'Medical Administration Support'],
    ['Multitasking', 'Multitasking'],
    ['Learning Attitude', 'Learning Attitude'],
    ['Empathy', 'Empathy']
  ], 'LEVEL 1');
};

const setAdminStatus = (cell, status) => {
  if (!cell) return;
  cell.replaceChildren();
  if (!status) return;
  const badge = document.createElement('span');
  badge.className = `admin-status-badge admin-status-${String(status).toLowerCase()}`;
  badge.textContent = status;
  cell.appendChild(badge);
};

const applyThresholdStatus = (row, threshold, mappings, adminLabel) => {
  const checks = mappings.map(([thresholdHeader, candidateHeader]) => {
    const thresholdIndex = threshold.headers.findIndex((header) => normalizeMappingValue(header) === normalizeMappingValue(thresholdHeader));
    const rawMinimum = String(threshold.values[thresholdIndex] ?? '').trim();
    const candidateValue = row.cells[getHistoryColumnIndex(candidateHeader)]?.textContent.trim() || '';
    const minimum = rawMinimum === '' ? NaN : Number(rawMinimum);
    return { minimum, score: Number(candidateValue), candidateValue, rawMinimum };
  }).filter(({ rawMinimum }) => rawMinimum !== '' && !/^(PASSED|FAILED)$/i.test(rawMinimum));
  const statusCell = row.querySelector(`[data-admin-label="${adminLabel}"]`);
  if (!checks.length) {
    setAdminStatus(statusCell, '');
    return '';
  }
  if (checks.some(({ candidateValue }) => candidateValue === '' || candidateValue === '-')) {
    setAdminStatus(statusCell, '');
    return '';
  }
  const status = checks.every(({ minimum, score, candidateValue, rawMinimum }) => (
    Number.isFinite(minimum) ? Number.isFinite(score) && score >= minimum : normalizeMappingValue(candidateValue) === normalizeMappingValue(rawMinimum)
  )) ? 'PASSED' : 'FAILED';
  setAdminStatus(statusCell, status);
  return status;
};

const applyLevel2Threshold = (row) => {
  const thresholdRows = getThresholdRows();
  const subprocess = row.cells[getHistoryColumnIndex('Account Subprocess')]?.textContent || '';
  const account = row.cells[getHistoryColumnIndex('Account')]?.textContent || '';
  const getThresholdValue = (threshold, header) => threshold.values[threshold.headers.findIndex((item) => normalizeMappingValue(item) === normalizeMappingValue(header))];
  const subprocessMatches = thresholdRows.filter((threshold) => normalizeMappingValue(getThresholdValue(threshold, 'Account Subprocess')) === normalizeMappingValue(subprocess));
  const matchingThreshold = subprocessMatches.find((threshold) => normalizeMappingValue(getThresholdValue(threshold, 'Account')) === normalizeMappingValue(account)) || subprocessMatches[0];
  if (!matchingThreshold) {
    row.querySelector('[data-admin-label="LEVEL 2"]')?.replaceChildren();
    return '';
  }
  return applyThresholdStatus(row, matchingThreshold, [
    ['Overall Matching Score Level 2', 'Overall Matching Score Level 2'],
    ['Spoken Language Assessment', 'Spoken Language Assessment'],
    ['CEFR Level', 'CEFR Level'],
    ['English Language Proficiency', 'English Language Proficiency'],
    ['Vocabulary', 'Vocabulary'],
    ['Grammar', 'Grammar'],
    ['Comprehension', 'Comprehension'],
    ['Typing Speed', 'Typing Speed'],
    ['Typing Score Percentage', 'Typing Score Percentage'],
    ['Basic Computer Literacy', 'Basic Computer Literacy'],
    ['Oncology', 'Oncology'],
    ['Anatomy', 'Anatomy'],
    ['Data Entry', 'Data Entry'],
    ['Clinical Acumen', 'Clinical Acumen'],
    ['Registered Nursing Test', 'Registered Nursing Test'],
    ['Spanish LATAM Proficiency', 'Spanish LATAM Proficiency']
  ], 'LEVEL 2');
};

const getThresholdForRow = (row) => {
  const thresholdRows = getThresholdRows();
  const subprocess = row.cells[getHistoryColumnIndex('Account Subprocess')]?.textContent || '';
  const account = row.cells[getHistoryColumnIndex('Account')]?.textContent || '';
  const getThresholdValue = (threshold, header) => threshold.values[threshold.headers.findIndex((item) => normalizeMappingValue(item) === normalizeMappingValue(header))];
  const subprocessMatches = thresholdRows.filter((threshold) => normalizeMappingValue(getThresholdValue(threshold, 'Account Subprocess')) === normalizeMappingValue(subprocess));
  return subprocessMatches.find((threshold) => normalizeMappingValue(getThresholdValue(threshold, 'Account')) === normalizeMappingValue(account)) || subprocessMatches[0];
};

const getAssessmentRemarks = (row) => {
  const threshold = getThresholdForRow(row);
  if (!threshold) return '-';
  const levelMappings = [
    { label: 'Level 1', status: 'LEVEL 1', mappings: [
      ['Overall Matching Score Level 1', 'Overall Matching Score Level 1', 'Level 1'],
      ['Situational Judgement Test (Global)', 'Situational Judgement Test (Global)', 'Situational Judgement'],
      ['Logical Reasoning', 'Logical Reasoning', 'Logical Reasoning'],
      ['Customer Support Personality', 'Customer Support Personality', 'Customer Support'],
      ['Claims Support Match', 'Claims Support Match', 'Claims Support'],
      ['Sales Support Match', 'Sales Support Match', 'Sales Support'],
      ['Medical Administration Support', 'Medical Administration Support', 'Medical Administration'],
      ['Multitasking', 'Multitasking', 'Multitasking'],
      ['Learning Attitude', 'Learning Attitude', 'Learning Attitude'],
      ['Empathy', 'Empathy', 'Empathy']
    ] },
    { label: 'Level 2', status: 'LEVEL 2', mappings: [
      ['Overall Matching Score Level 2', 'Overall Matching Score Level 2', 'Level 2'],
      ['Spoken Language Assessment', 'Spoken Language Assessment', 'Spoken Language'],
      ['CEFR Level', 'CEFR Level', 'CEFR'],
      ['English Language Proficiency', 'English Language Proficiency', 'English'],
      ['Vocabulary', 'Vocabulary', 'Vocabulary'],
      ['Grammar', 'Grammar', 'Grammar'],
      ['Comprehension', 'Comprehension', 'Comprehension'],
      ['Typing Speed', 'Typing Speed', 'Typing'],
      ['Typing Score Percentage', 'Typing Score Percentage', 'Typing Score'],
      ['Basic Computer Literacy', 'Basic Computer Literacy', 'Computer'],
      ['Oncology', 'Oncology', 'Oncology'],
      ['Anatomy', 'Anatomy', 'Anatomy'],
      ['Data Entry', 'Data Entry', 'Data Entry'],
      ['Clinical Acumen', 'Clinical Acumen', 'Clinical Acumen'],
      ['Registered Nursing Test', 'Registered Nursing Test', 'RNT'],
      ['Spanish LATAM Proficiency', 'Spanish LATAM Proficiency', 'Spanish']
    ] }
  ];
  const pending = [];
  const failures = [];
  levelMappings.forEach(({ label, status, mappings }) => {
    const statusValue = row.querySelector(`[data-admin-label="${status}"]`)?.textContent.trim() || '-';
    const checks = mappings.map(([thresholdHeader, candidateHeader, displayName]) => {
      const thresholdIndex = threshold.headers.findIndex((header) => normalizeMappingValue(header) === normalizeMappingValue(thresholdHeader));
      const rawMinimum = String(threshold.values[thresholdIndex] ?? '').trim();
      const candidateValue = row.cells[getHistoryColumnIndex(candidateHeader)]?.textContent.trim() || '';
      return { rawMinimum, candidateValue, displayName, minimum: Number(rawMinimum), score: Number(candidateValue) };
    }).filter(({ rawMinimum }) => rawMinimum !== '' && !/^(PASSED|FAILED)$/i.test(rawMinimum));
    if (statusValue === '-' && checks.some(({ candidateValue }) => candidateValue === '' || candidateValue === '-')) pending.push(label);
    if (statusValue === 'FAILED') {
      checks.forEach(({ rawMinimum, candidateValue, displayName, minimum, score }) => {
        const failed = Number.isFinite(minimum)
          ? Number.isFinite(score) && score < minimum
          : normalizeMappingValue(candidateValue) !== normalizeMappingValue(rawMinimum);
        if (failed) failures.push(`${displayName} (${candidateValue})`);
      });
    }
  });
  if (failures.length) return `Failed ${failures.join(', ')}`;
  if (pending.length === 2) return 'Pending Level 1 and 2';
  if (pending.length === 1) return `Pending ${pending[0]}`;
  const level1Status = row.querySelector('[data-admin-label="LEVEL 1"]')?.textContent.trim();
  const level2Status = row.querySelector('[data-admin-label="LEVEL 2"]')?.textContent.trim();
  return level1Status === 'PASSED' && level2Status === 'PASSED' ? 'Passed Assessment' : '-';
};

const updateAssessmentRemarks = (row) => {
  const remarksCell = row.querySelector('.assessment-remarks-cell');
  if (!remarksCell) return;
  const remarks = getAssessmentRemarks(row);
  const remarksBadge = document.createElement('span');
  remarksBadge.className = 'remarks-badge';
  remarksBadge.textContent = remarks;
  remarksCell.replaceChildren(remarksBadge);
  remarksCell.classList.remove('remarks-passed', 'remarks-pending', 'remarks-failed');
  if (/^Passed Assessment$/i.test(remarks)) remarksCell.classList.add('remarks-passed');
  else if (/^Pending /i.test(remarks)) remarksCell.classList.add('remarks-pending');
  else if (/^Failed /i.test(remarks)) remarksCell.classList.add('remarks-failed');
};

const refreshLevel1ThresholdStatuses = () => {
  if (isUserEditingHistoryCell()) return;
  let statusChanged = false;
  [...(historyTableBody?.rows || [])].forEach((row) => {
    const level1StatusCell = row.querySelector('[data-admin-label="LEVEL 1"]');
    const level2StatusCell = row.querySelector('[data-admin-label="LEVEL 2"]');
    const previousLevel1Status = level1StatusCell?.textContent || '';
    const previousLevel2Status = level2StatusCell?.textContent || '';
    const previousLevel2Score = row.cells[getHistoryColumnIndex('Overall Matching Score Level 2')]?.textContent || '';
    updateLevel2Average(row);
    const level1Status = applyLevel1Threshold(row);
    if (level1Status === 'FAILED') setAdminStatus(level2StatusCell, '');
    else applyLevel2Threshold(row);
    const previousRemarks = row.querySelector('.assessment-remarks-cell')?.textContent || '';
    updateAssessmentRemarks(row);
    statusChanged = statusChanged
      || previousLevel1Status !== (level1StatusCell?.textContent || '')
      || previousLevel2Status !== (level2StatusCell?.textContent || '')
      || previousLevel2Score !== (row.cells[getHistoryColumnIndex('Overall Matching Score Level 2')]?.textContent || '')
      || previousRemarks !== (row.querySelector('.assessment-remarks-cell')?.textContent || '');
  });
  if (statusChanged) saveHistory();
};

window.addEventListener('storage', (event) => {
  if (event.key === 'thresholdWorkbookData' || event.key === 'thresholdWorkbookUpdatedAt') refreshLevel1ThresholdStatuses();
});
window.addEventListener('focus', refreshLevel1ThresholdStatuses);
const updateLevel2Average = (row) => {
  const sourceColumns = ['Spoken Language Assessment', 'English Language Proficiency', 'Typing Score Percentage', 'Basic Computer Literacy']
    .map(getHistoryColumnIndex);
  const scores = sourceColumns
    .map((cellIndex) => row.cells[cellIndex]?.textContent.trim() || '')
    .filter((value) => value !== '' && value !== '-')
    .map(Number)
    .filter((score) => Number.isFinite(score));
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  const statusColumn = getHistoryColumnIndex('Overall Matching Status Level 2');
  const scoreColumn = getHistoryColumnIndex('Overall Matching Score Level 2');
  row.cells[statusColumn].textContent = average === null ? '' : (average >= 50 ? 'Good Fit' : 'Poor Fit');
  row.cells[scoreColumn].textContent = average === null ? '' : String(average);
};

const runLevel2Import = (pastedResults, row) => {
  const values = {
    overallMatchingScoreLevel: getLevel2Average(pastedResults),
    spokenLanguageAssessment: findScore(pastedResults, ['Spoken Language Assessment']),
    spokenLanguageProficiency1: findProficiencyScore(pastedResults, 'Pronunciation'),
    spokenLanguageProficiency2: findProficiencyScore(pastedResults, 'Read aloud'),
    spokenLanguageProficiency3: findProficiencyScore(pastedResults, 'Listen and repeat'),
    cefrLevel: findValue(pastedResults, [/IELTS Band Score[\s\S]{0,80}?\b(B[12]|C[12])\s*CEFR Level\b/i, /\bCEFR Level\s*[:\-]?\s*(B[12]|C[12])\b/i, /\b(B[12]|C[12])\s*(?:CEFR Level|and\s+above)\b/i, /\bEnglish\b(?:\s+Language\s+Proficiency)?\s*[:\-]?\s*(B[12]|C[12])\b/i, /\bEnglish\b\s+(B[12]|C[12])\b/i]),
    standardEnglishLanguage: findScore(pastedResults, ['English Language Proficiency', 'Standard English Language']),
    vocabulary: findScore(pastedResults, ['Vocabulary']),
    grammar: findScore(pastedResults, ['Grammar']),
    comprehension: findScore(pastedResults, ['Comprehension']),
    typingSpeed: findValue(pastedResults, [/Adjusted Speed\s*[:\-]?\s*(\d+)\b/i, /(\d+)\s*-\s*\d+\s*wpm/i, /(\d+)\s*wpm/i]),
    typingScorePercentage: findValue(pastedResults, [
      /([0-9]{1,3})\s*%\s*Typing Skills/i,
      /Typing Skills\s*(?:Overall\s*)?([0-9]{1,3})\s*%/i,
      /Typing Assessment[\s\S]{0,160}?Overall\s+([0-9]{1,3})\s*%/i
    ]),
    standardComputerProficiency: findScore(pastedResults, ['Basic Computery Literacy', 'Basic Computer Literacy', 'Standard Computer Proficiency', 'Computer Proficiency'])
  };
  const score = Number(values.overallMatchingScoreLevel);
  const level2StatusColumn = getHistoryColumnIndex('Overall Matching Status Level 2');
  row.cells[level2StatusColumn].textContent = Number.isFinite(score) ? (score >= 50 ? 'Good Fit' : 'Poor Fit') : '-';
  updateRowCells(row, values, {
    overallMatchingScoreLevel: getHistoryColumnIndex('Overall Matching Score Level 2'),
    spokenLanguageAssessment: getHistoryColumnIndex('Spoken Language Assessment'),
    spokenLanguageProficiency1: getHistoryColumnIndex('Pronunciation'),
    spokenLanguageProficiency2: getHistoryColumnIndex('Read aloud'),
    spokenLanguageProficiency3: getHistoryColumnIndex('Listen and repeat'),
    cefrLevel: getHistoryColumnIndex('CEFR Level'),
    standardEnglishLanguage: getHistoryColumnIndex('English Language Proficiency'),
    vocabulary: getHistoryColumnIndex('Vocabulary'),
    grammar: getHistoryColumnIndex('Grammar'),
    comprehension: getHistoryColumnIndex('Comprehension'),
    typingSpeed: getHistoryColumnIndex('Typing Speed'),
    typingScorePercentage: getHistoryColumnIndex('Typing Score Percentage'),
    standardComputerProficiency: getHistoryColumnIndex('Basic Computer Literacy')
  });
  return Object.values(values).filter(Boolean).length;
};

const runLevelImport = () => {
  const selectedRowIndex = Number(assessmentCandidateName?.value);
  const level1Text = document.querySelector('#level-1')?.value.trim() || '';
  const level2Text = document.querySelector('#level-2')?.value.trim() || '';
  const level1RetakeText = document.querySelector('#level-1-retake')?.value.trim() || '';
  const level2RetakeText = document.querySelector('#level-2-retake')?.value.trim() || '';
  const level3Text = document.querySelector('#level-3')?.value.trim() || '';
  const level3RetakeText = document.querySelector('#level-3-retake')?.value.trim() || '';
  const message = document.querySelector('#run-message');
  const matchingRow = Number.isInteger(selectedRowIndex) ? historyTableBody?.rows[selectedRowIndex] : null;
  if (!matchingRow) {
    if (message) message.textContent = 'Select a candidate name first.';
    return;
  }
  const hasAnyInput = [level1Text, level2Text, level1RetakeText, level2RetakeText, level3Text, level3RetakeText].some((text) => text.trim().length > 0);
  if (!hasAnyInput) {
    if (message) message.textContent = 'No new score data entered. Existing saved scores were kept.';
    return;
  }
  if ([level1Text, level2Text, level1RetakeText, level2RetakeText, level3Text, level3RetakeText].some((text) => /^https?:\/\//i.test(text))) {
    if (message) message.textContent = 'Paste copied score text; a link alone cannot be read by this local page.';
    return;
  }
  let updatedCount = 0;
  const importLevel1 = (text) => {
    if (!text) return 0;
    const values = {};
    scoreFields.forEach(([key, labels]) => { values[key] = findScore(text, labels); });
    values.standardComputerProficiency = findScore(text, ['Basic Computery Literacy', 'Basic Computer Literacy', 'Computer Proficiency']);
    updateRowCells(matchingRow, values, {
      overallMatchingScore: getHistoryColumnIndex('Overall Matching Score Level 1'),
      situationalJudgement: getHistoryColumnIndex('Situational Judgement Test (Global)'),
      logicalReasoning: getHistoryColumnIndex('Logical Reasoning'),
      customerSupportPersonality: getHistoryColumnIndex('Customer Support Personality'),
      claimsSupportMatch: getHistoryColumnIndex('Claims Support Match'),
      salesSupportMatch: getHistoryColumnIndex('Sales Support Match'),
      medicalAdministrationSupport: getHistoryColumnIndex('Medical Administration Support'),
      multitasking: getHistoryColumnIndex('Multitasking'),
      learningAttitude: getHistoryColumnIndex('Learning Attitude'),
      empathy: getHistoryColumnIndex('Empathy')
    });
    if (values.standardComputerProficiency) matchingRow.cells[getHistoryColumnIndex('Basic Computer Literacy')].textContent = values.standardComputerProficiency;
    if (values.overallMatchingScore) {
      const statusCell = matchingRow.cells[getHistoryColumnIndex('Overall Matching Status Level 1')];
      if (statusCell) statusCell.textContent = text.match(/Great Fit|Good Fit|Poor Fit/i)?.[0] || '-';
    }
    return Object.values(values).filter(Boolean).length;
  };
  updatedCount += importLevel1(level1Text);
  updatedCount += importLevel1(level1RetakeText);
  if (level2Text) updatedCount += runLevel2Import(level2Text, matchingRow);
  if (level2RetakeText) updatedCount += runLevel2Import(level2RetakeText, matchingRow);
  if (level2Text || level2RetakeText) {
    const typingRetakeScore = /typing assessment/i.test(level2RetakeText)
      ? findValue(level2RetakeText, [/\bOverall\s*[:\-]?\s*(\d{1,3})\s*%/i])
      : '';
    if (typingRetakeScore) matchingRow.cells[getHistoryColumnIndex('Typing Score Percentage')].textContent = typingRetakeScore;
    updateLevel2Average(matchingRow);
  }
  const level1Status = applyLevel1Threshold(matchingRow);
  if (level1Status === 'FAILED') setAdminStatus(matchingRow.querySelector('[data-admin-label="LEVEL 2"]'), '');
  else applyLevel2Threshold(matchingRow);
  updateAssessmentRemarks(matchingRow);
  const importLevel3 = (text) => {
    if (!text) return 0;
    const values = {
      customizedPhilippinesOncology: findLevel3Score(text, ['Customized Philippines Oncology', 'Oncology', 'AR- Oncology']),
      customizedPhilippinesAnatomy: findLevel3Score(text, ['Customized Philippines Anatomy', 'Anatomy', 'AR- Anatomy']),
      labCorpAssessment: findLevel3Score(text, ['Data Entry', 'LabCorp Assessment', 'LabCorp', 'AR- LabCorp']),
      customizedPhilippinesClinical: findLevel3Score(text, ['Customized Philippines Clinical', 'Clinical Acumen', 'AR- Clinical']),
      customizedPhilippinesRegistered: findLevel3Score(text, ['Customized Philippines Registered', 'Registered', 'AR- Registered']),
      spanishLatamProficiency: findLevel3Score(text, ['Spanish LATAM Proficiency', 'Spanish LATAM', 'Spanish', 'AR- Spanish'])
    };
    updateRowCells(matchingRow, values, {
      customizedPhilippinesOncology: getHistoryColumnIndex('Oncology'),
      customizedPhilippinesAnatomy: getHistoryColumnIndex('Anatomy'),
      labCorpAssessment: getHistoryColumnIndex('Data Entry'),
      customizedPhilippinesClinical: getHistoryColumnIndex('Clinical Acumen'),
      customizedPhilippinesRegistered: getHistoryColumnIndex('Registered Nursing Test'),
      spanishLatamProficiency: getHistoryColumnIndex('Spanish LATAM Proficiency')
    });
    if (!values.customizedPhilippinesClinical && /oncology/i.test(text)) {
      matchingRow.cells[getHistoryColumnIndex('Clinical Acumen')].textContent = '';
    }
    return Object.values(values).filter(Boolean).length;
  };
  if (level3Text) updatedCount += importLevel3(level3Text);
  if (level3RetakeText) updatedCount += importLevel3(level3RetakeText);
  if (message) {
    message.textContent = updatedCount ? 'Successfully updated the scores.' : 'No matching score labels were found in the pasted text.';
    message.classList.toggle('run-success', updatedCount > 0);
  }
  if (updatedCount) {
    saveHistory();
    [
      assessmentSeatFilter,
      assessmentCandidateName,
      assessmentCandidateEmail,
      document.querySelector('#level-1'),
      document.querySelector('#level-2'),
      document.querySelector('#level-3'),
      document.querySelector('#level-1-retake'),
      document.querySelector('#level-2-retake'),
      document.querySelector('#level-3-retake')
    ].forEach((field) => {
      if (field) field.value = '';
    });
  }
};

runButton?.addEventListener('click', runLevelImport);

const resourcesButton = document.querySelector('.resources');
const resourcesOverlay = document.querySelector('.resources-overlay');
const resourcesModal = document.querySelector('.resources-modal');
const resourcesClose = document.querySelector('.resources-close');

const toggleResourcesModal = (show) => {
  if (!resourcesOverlay) return;
  resourcesOverlay.hidden = !show;
  resourcesButton?.setAttribute('aria-expanded', String(show));
};

resourcesButton?.addEventListener('click', () => {
  const isOpen = !resourcesOverlay?.hasAttribute('hidden');
  toggleResourcesModal(!isOpen);
});

resourcesClose?.addEventListener('click', () => toggleResourcesModal(false));

resourcesOverlay?.addEventListener('click', (event) => {
  if (event.target === resourcesOverlay) toggleResourcesModal(false);
});

document.querySelectorAll('.resources-option').forEach((option) => {
  option.addEventListener('click', () => {
    const targetUrl = option.dataset.url;
    if (targetUrl) {
      window.location.href = targetUrl;
      return;
    }
    toggleResourcesModal(false);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !resourcesOverlay?.hasAttribute('hidden')) {
    toggleResourcesModal(false);
  }
});

const createHistoryRow = (candidate, rowNumber) => {
  const row = document.createElement('tr');
  row.innerHTML = `<td><input type="checkbox" aria-label="Select ${candidate.name}"></td><td><button class="view-button" type="button">View</button></td><td>${rowNumber}</td><td>${candidate.name}</td><td>${candidate.email}</td><td>${candidate.location}</td><td>${candidate.status}</td><td>${candidate.mode}</td><td>${candidate.education}</td><td>${candidate.segment}</td><td>${candidate.account}</td><td>${candidate.subprocess}</td><td>${candidate.recruiter}</td><td>${candidate.overallStatus || '-'}</td><td>${candidate.overallMatchingScore || '-'}</td><td>${candidate.situationalJudgement || '-'}</td><td>${candidate.logicalReasoning || '-'}</td><td>${candidate.customerSupportPersonality || '-'}</td><td>${candidate.claimsSupportMatch || '-'}</td><td>${candidate.salesSupportMatch || '-'}</td><td>${candidate.medicalAdministrationSupport || '-'}</td><td>${candidate.multitasking || '-'}</td><td>${candidate.learningAttitude || '-'}</td><td>${candidate.empathy || '-'}</td><td>${candidate.overallMatchingStatusLevel2 || '-'}</td><td>${candidate.overallMatchingScoreLevel || '-'}</td><td>${candidate.spokenLanguageAssessment || '-'}</td><td>${candidate.spokenLanguageProficiency1 || '-'}</td><td>${candidate.spokenLanguageProficiency2 || '-'}</td><td>${candidate.spokenLanguageProficiency3 || '-'}</td><td>${candidate.cefrLevel || '-'}</td><td>${candidate.standardEnglishLanguage || '-'}</td><td>${candidate.vocabulary || '-'}</td><td>${candidate.grammar || '-'}</td><td>${candidate.comprehension || '-'}</td><td>${candidate.typingSpeed || '-'}</td><td>${candidate.typingScorePercentage || '-'}</td><td>${candidate.standardComputerProficiency || '-'}</td><td>${candidate.customizedPhilippinesOncology || '-'}</td><td>${candidate.customizedPhilippinesAnatomy || '-'}</td><td>${candidate.labCorpAssessment || '-'}</td><td>${candidate.customizedPhilippinesClinical || '-'}</td><td>${candidate.customizedPhilippinesRegistered || '-'}</td><td>${candidate.spanishLatamProficiency || '-'}</td>`;
  const selectionCell = row.cells[0];
  const selectionCheckbox = selectionCell.querySelector('input[type="checkbox"]');
  selectionCheckbox.addEventListener('change', updateHistoryActions);
  selectionCell.addEventListener('click', (event) => {
    if (event.target !== selectionCheckbox) selectionCheckbox.checked = !selectionCheckbox.checked;
    updateHistoryActions();
  });
  const dateSeatInput = document.createElement('input');
  dateSeatInput.className = 'date-seat-input';
  dateSeatInput.type = 'text';
  dateSeatInput.value = candidate.dateSeat || '';
  dateSeatInput.placeholder = 'Date/Seat';
  dateSeatInput.setAttribute('aria-label', `Date or seat for ${candidate.name}`);
  const updateDateSeatHighlight = () => dateSeatInput.classList.toggle('seat-entry', /\bseat\b/i.test(dateSeatInput.value));
  dateSeatInput.addEventListener('keydown', (event) => {
    if (event.key === ' ') event.stopPropagation();
  });
  dateSeatInput.addEventListener('input', updateDateSeatHighlight);
  updateDateSeatHighlight();
  row.children[1].replaceChildren(dateSeatInput);
  const candidateIdCell = document.createElement('td');
  const candidateIdInput = document.createElement('input');
  candidateIdInput.className = 'candidate-id-table-input';
  candidateIdInput.type = 'text';
  candidateIdInput.value = candidate.id === '-' ? '' : (candidate.id || '');
  candidateIdInput.placeholder = 'Candidate ID';
  candidateIdInput.setAttribute('aria-label', `Candidate ID for ${candidate.name}`);
  candidateIdCell.appendChild(candidateIdInput);
  row.insertBefore(candidateIdCell, row.children[3]);
  const remarksCell = document.createElement('td');
  remarksCell.className = 'assessment-remarks-cell';
  remarksCell.textContent = candidate.remarks || '-';
  row.insertBefore(remarksCell, row.children[3]);
  const workdayStatusCell = document.createElement('td');
  workdayStatusCell.className = 'workday-status-cell';
  const workdayStatusSelect = document.createElement('select');
  workdayStatusSelect.className = 'workday-status-select';
  workdayStatusSelect.setAttribute('aria-label', `Workday status for ${candidate.name}`);
  workdayStatusSelect.innerHTML = '<option value="">Select status</option>' + workdayStatusOptions.map((status) => `<option value="${status}">${status}</option>`).join('');
  const updateWorkdayStatusColor = () => {
    workdayStatusCell.dataset.status = workdayStatusSelect.value.toLowerCase();
  };
  workdayStatusSelect.addEventListener('change', updateWorkdayStatusColor);
  workdayStatusCell.appendChild(workdayStatusSelect);
  row.insertBefore(workdayStatusCell, row.children[5]);
  row.insertBefore(row.children[1], row.children[4]);
  const modeClass = String(candidate.mode || '').toLowerCase();
  const modeCell = row.cells[getHistoryColumnIndex('Assessment Mode')];
  if (modeCell) {
    const modeBadge = document.createElement('span');
    modeBadge.className = `mode-badge mode-${modeClass}`;
    modeBadge.textContent = candidate.mode || '';
    modeCell.textContent = '';
    modeCell.appendChild(modeBadge);
  }
  ['LEVEL 1', 'LEVEL 2'].forEach((label, index) => {
    const cell = document.createElement('td');
    const status = index === 0 ? (candidate.level1Status || '') : (candidate.level2Status || '');
    cell.dataset.adminLabel = label;
    setAdminStatus(cell, status === '-' ? '' : status);
    row.insertBefore(cell, row.children[16 + index]);
  });
  row.querySelectorAll('td').forEach((cell) => {
    if (cell.textContent.trim() === '-') cell.textContent = '';
  });
  return row;
};

['LEVEL 1', 'LEVEL 2'].forEach((label, index) => {
  const header = document.createElement('th');
  header.textContent = label;
  const headerRow = document.querySelector('.history-table thead tr');
  headerRow?.insertBefore(header, headerRow.children[13 + index]);
});
const numberHeader = [...document.querySelectorAll('.history-table thead th')].find((header) => header.textContent.trim() === '#');
if (numberHeader) {
  const candidateIdHeader = document.createElement('th');
  candidateIdHeader.textContent = 'ID Number';
  numberHeader.parentElement.insertBefore(candidateIdHeader, numberHeader.nextElementSibling);
  const remarksHeader = document.createElement('th');
  remarksHeader.textContent = 'Assessment Remarks';
  numberHeader.parentElement.insertBefore(remarksHeader, candidateIdHeader);
  const workdayStatusHeader = document.createElement('th');
  workdayStatusHeader.textContent = 'Workday Status';
  candidateIdHeader.parentElement.insertBefore(workdayStatusHeader, candidateIdHeader.nextElementSibling);
  const dateSeatHeader = [...candidateIdHeader.parentElement.children].find((header) => ['View', 'Date/Seat'].includes(header.textContent.trim()));
  if (dateSeatHeader) candidateIdHeader.parentElement.insertBefore(dateSeatHeader, candidateIdHeader);
}
const spokenHeaderNames = ['Pronunciation', 'Read aloud', 'Listen and repeat'];
['Spoken Language Proficiency 1', 'Spoken Language Proficiency 2', 'Spoken Language Proficiency 3'].forEach((name, index) => {
  const header = [...document.querySelectorAll('.history-table thead th')].find((item) => item.textContent.trim() === name);
  if (header) header.textContent = spokenHeaderNames[index];
});
const headerRenames = {
  'Overall Matching Score': 'Overall Matching Score Level 1',
  'Overall Matching Score-Level': 'Overall Matching Score Level 2',
  'Standard English Language': 'English Language Proficiency',
  'Standard Computer Proficiency': 'Basic Computer Literacy',
  'Basic Computery Literacy': 'Basic Computer Literacy'
};
document.querySelectorAll('.history-table thead th').forEach((header) => {
  const renamed = headerRenames[header.textContent.trim()];
  if (renamed) header.textContent = renamed;
});
const viewHeader = [...document.querySelectorAll('.history-table thead th')].find((header) => header.textContent.trim() === 'View');
if (viewHeader) viewHeader.textContent = 'Date/Seat';

const historyHead = document.querySelector('.history-table thead');
const columnNameRow = historyHead?.querySelector('tr');
if (historyHead && columnNameRow) {
  const columnLetterRow = document.createElement('tr');
  columnLetterRow.className = 'column-letter-row';
  const getColumnLabel = (columnNumber) => {
    let label = '';
    let number = columnNumber;
    while (number > 0) {
      number -= 1;
      label = String.fromCharCode(65 + (number % 26)) + label;
      number = Math.floor(number / 26);
    }
    return label;
  };
  [...columnNameRow.children].forEach((header, index) => {
    const letterHeader = document.createElement('th');
    letterHeader.textContent = getColumnLabel(index + 1);
    letterHeader.setAttribute('aria-label', `${getColumnLabel(index + 1)}: ${header.textContent.trim()}`);
    columnLetterRow.appendChild(letterHeader);
  });
  historyHead.insertBefore(columnLetterRow, columnNameRow);
}

const getWorkdayIdFromName = (name = '') => {
  const match = String(name).match(/\b(?:CD|ONL)[A-Z0-9]+\b/i);
  if (!match) return '';
  return match[0].trim().toUpperCase();
};

const exportHistoryCsv = () => {
  const rowsToExport = [...(historyTableBody?.rows || [])]
    .filter((row) => !row.hidden)
    .map((row) => {
      const rowData = {};
      const name = row.cells[getHistoryColumnIndex('Name')]?.textContent.trim() || '';
      const email = row.cells[getHistoryColumnIndex('Email')]?.textContent.trim() || '';
      const location = row.cells[getHistoryColumnIndex('Location')]?.textContent.trim() || '';
      const candidateStatus = row.cells[getHistoryColumnIndex('Candidate Status')]?.textContent.trim() || '';
      const assessmentMode = row.cells[getHistoryColumnIndex('Assessment Mode')]?.textContent.trim() || '';
      const education = row.cells[getHistoryColumnIndex('Education')]?.textContent.trim() || '';
      const segment = row.cells[getHistoryColumnIndex('Segment')]?.textContent.trim() || '';
      const account = row.cells[getHistoryColumnIndex('Account')]?.textContent.trim() || '';
      const subprocess = row.cells[getHistoryColumnIndex('Account Subprocess')]?.textContent.trim() || '';
      const recruiter = row.cells[getHistoryColumnIndex('Name of Recruiter')]?.textContent.trim() || '';
      const dateSeat = row.querySelector('.date-seat-input')?.value || '';
      const remarks = row.querySelector('.assessment-remarks-input')?.value || row.querySelector('.assessment-remarks-cell')?.textContent.trim() || '';
      rowData.name = name;
      rowData.email = email;
      rowData.location = location;
      rowData.status = candidateStatus;
      rowData.mode = assessmentMode;
      rowData.education = education;
      rowData.segment = segment;
      rowData.account = account;
      rowData.subprocess = subprocess;
      rowData.recruiter = recruiter;
      rowData.dateSeat = dateSeat;
      rowData.remarks = remarks;
      rowData.level1Status = row.querySelector('[data-admin-label="LEVEL 1"]')?.textContent.trim() || '';
      rowData.level2Status = row.querySelector('[data-admin-label="LEVEL 2"]')?.textContent.trim() || '';
      rowData.overallStatus = row.cells[getHistoryColumnIndex('Overall Matching Status Level 1')]?.textContent.trim() || '';
      rowData.overallMatchingScore = row.cells[getHistoryColumnIndex('Overall Matching Score Level 1')]?.textContent.trim() || '';
      rowData.situationalJudgement = row.cells[getHistoryColumnIndex('Situational Judgement Test (Global)')]?.textContent.trim() || '';
      rowData.logicalReasoning = row.cells[getHistoryColumnIndex('Logical Reasoning')]?.textContent.trim() || '';
      rowData.customerSupportPersonality = row.cells[getHistoryColumnIndex('Customer Support Personality')]?.textContent.trim() || '';
      rowData.claimsSupportMatch = row.cells[getHistoryColumnIndex('Claims Support Match')]?.textContent.trim() || '';
      rowData.salesSupportMatch = row.cells[getHistoryColumnIndex('Sales Support Match')]?.textContent.trim() || '';
      rowData.medicalAdministrationSupport = row.cells[getHistoryColumnIndex('Medical Administration Support')]?.textContent.trim() || '';
      rowData.multitasking = row.cells[getHistoryColumnIndex('Multitasking')]?.textContent.trim() || '';
      rowData.learningAttitude = row.cells[getHistoryColumnIndex('Learning Attitude')]?.textContent.trim() || '';
      rowData.empathy = row.cells[getHistoryColumnIndex('Empathy')]?.textContent.trim() || '';
      rowData.overallMatchingStatusLevel2 = row.cells[getHistoryColumnIndex('Overall Matching Status Level 2')]?.textContent.trim() || '';
      rowData.overallMatchingScoreLevel = row.cells[getHistoryColumnIndex('Overall Matching Score Level 2')]?.textContent.trim() || '';
      rowData.spokenLanguageAssessment = row.cells[getHistoryColumnIndex('Spoken Language Assessment')]?.textContent.trim() || '';
      rowData.spokenLanguageProficiency1 = row.cells[getHistoryColumnIndex('Pronunciation')]?.textContent.trim() || '';
      rowData.spokenLanguageProficiency2 = row.cells[getHistoryColumnIndex('Read aloud')]?.textContent.trim() || '';
      rowData.spokenLanguageProficiency3 = row.cells[getHistoryColumnIndex('Listen and repeat')]?.textContent.trim() || '';
      rowData.cefrLevel = row.cells[getHistoryColumnIndex('CEFR Level')]?.textContent.trim() || '';
      rowData.standardEnglishLanguage = row.cells[getHistoryColumnIndex('English Language Proficiency')]?.textContent.trim() || '';
      rowData.vocabulary = row.cells[getHistoryColumnIndex('Vocabulary')]?.textContent.trim() || '';
      rowData.grammar = row.cells[getHistoryColumnIndex('Grammar')]?.textContent.trim() || '';
      rowData.comprehension = row.cells[getHistoryColumnIndex('Comprehension')]?.textContent.trim() || '';
      rowData.typingSpeed = row.cells[getHistoryColumnIndex('Typing Speed')]?.textContent.trim() || '';
      rowData.typingScorePercentage = row.cells[getHistoryColumnIndex('Typing Score Percentage')]?.textContent.trim() || '';
      rowData.standardComputerProficiency = row.cells[getHistoryColumnIndex('Basic Computer Literacy')]?.textContent.trim() || '';
      rowData.customizedPhilippinesOncology = row.cells[getHistoryColumnIndex('Oncology')]?.textContent.trim() || '';
      rowData.customizedPhilippinesAnatomy = row.cells[getHistoryColumnIndex('Anatomy')]?.textContent.trim() || '';
      rowData.labCorpAssessment = row.cells[getHistoryColumnIndex('Data Entry')]?.textContent.trim() || '';
      rowData.customizedPhilippinesClinical = row.cells[getHistoryColumnIndex('Clinical Acumen')]?.textContent.trim() || '';
      rowData.customizedPhilippinesRegistered = row.cells[getHistoryColumnIndex('Registered Nursing Test')]?.textContent.trim() || '';
      rowData.spanishLatamProficiency = row.cells[getHistoryColumnIndex('Spanish LATAM Proficiency')]?.textContent.trim() || '';
      return rowData;
    });

  if (!rowsToExport.length) return;

  const headers = [
    'Date',
    'Mode',
    'Workday ID',
    'Email',
    'Name',
    'ACCOUNT',
    'SUBPROCESS',
    'LEVEL 1',
    'LEVEL 2',
    'Overall Matching Status Level 1',
    'Overall Matching Score Level 1',
    'Situational Judgement Test (Global)',
    'Logical Reasoning',
    'Customer Support Personality',
    'Claims Support Match',
    'Sales Support Match',
    'Medical Administration Support',
    'Multitasking',
    'Learning Attitude',
    'Empathy',
    'Overall Matching Status Level 2',
    'Overall Matching Score Level 2',
    'Spoken Language Assessment',
    'Pronunciation',
    'Read Aloud',
    'Listen and Repeat',
    'CEFR Level',
    'English Language Proficiency',
    'Vocabulary',
    'Grammar',
    'Comprehension',
    'Typing Speed',
    'Typing Score Percentage',
    'Basic Computer Literacy',
    'Oncology',
    'Anatomy',
    'Data Entry',
    'Clinical Acumen',
    'Registered Nursing Test',
    'Spanish LATAM Proficiency',
    'candidate status',
    'assessment Remarks',
    'Assessment Mode',
    'Education',
    'Segment'
  ];

  const escapeCsvValue = (value) => {
    const normalized = value == null ? '' : String(value).replace(/\r?\n/g, ' ').trim();
    const text = normalized === '-' ? '' : normalized;
    return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csvRows = [headers.map(escapeCsvValue).join(',')];

  rowsToExport.forEach((row) => {
    const nameValue = String(row.name || '').trim();
    const workdayId = getWorkdayIdFromName(nameValue);
    const exportedRow = [
      row.dateSeat || '',
      row.mode || '',
      workdayId || '',
      row.email || '',
      nameValue && workdayId ? `${nameValue} (${workdayId})` : nameValue,
      row.account || '',
      row.subprocess || '',
      row.level1Status || '',
      row.level2Status || '',
      row.overallStatus || '',
      row.overallMatchingScore || '',
      row.situationalJudgement || '',
      row.logicalReasoning || '',
      row.customerSupportPersonality || '',
      row.claimsSupportMatch || '',
      row.salesSupportMatch || '',
      row.medicalAdministrationSupport || '',
      row.multitasking || '',
      row.learningAttitude || '',
      row.empathy || '',
      row.overallMatchingStatusLevel2 || '',
      row.overallMatchingScoreLevel || '',
      row.spokenLanguageAssessment || '',
      row.spokenLanguageProficiency1 || '',
      row.spokenLanguageProficiency2 || '',
      row.spokenLanguageProficiency3 || '',
      row.cefrLevel || '',
      row.standardEnglishLanguage || '',
      row.vocabulary || '',
      row.grammar || '',
      row.comprehension || '',
      row.typingSpeed || '',
      row.typingScorePercentage || '',
      row.standardComputerProficiency || '',
      row.customizedPhilippinesOncology || '',
      row.customizedPhilippinesAnatomy || '',
      row.labCorpAssessment || '',
      row.customizedPhilippinesClinical || '',
      row.customizedPhilippinesRegistered || '',
      row.spanishLatamProficiency || '',
      row.status || '',
      row.remarks || '',
      row.mode || '',
      row.education || '',
      row.segment || ''
    ];
    csvRows.push(exportedRow.map(escapeCsvValue).join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `endorsement-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

loadHistory();
refreshAssessmentNames();
updateHistoryActions();
refreshLevel1ThresholdStatuses();

const exportButton = document.querySelector('.history-footer .export-button');
exportButton?.addEventListener('click', exportHistoryCsv);

candidateForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const submitMessage = document.querySelector('#submit-message');
  if (!locationFilter?.value || locationFilter.value === 'All Data') {
    window.alert('Please choose a location first.');
    locationFilter.focus();
    return;
  }
  const candidateIdValue = document.querySelector('#candidate-id')?.value.trim() || '';
  const candidateIdNumber = Number(candidateIdValue);
  if (candidateIdValue && (!/^\d+$/.test(candidateIdValue) || !Number.isInteger(candidateIdNumber) || candidateIdNumber < 0 || candidateIdNumber > 500)) {
    const candidateIdField = document.querySelector('#candidate-id');
    candidateIdField?.focus();
    if (submitMessage) {
      submitMessage.textContent = 'Candidate ID Number must be a whole number from 0 to 500.';
      submitMessage.classList.remove('run-success');
    }
    return;
  }
  const requiredFields = [
    ['#workday-name', 'Workday Name'],
    ['#candidate-email', 'Email'],
    ['#candidate-id', 'Candidate ID Number'],
    ['#candidate-status', 'Candidates Status'],
    ['#assessment-mode', 'Mode of Assessment'],
    ['#education-level', 'Level of Education'],
    ['#segment', 'Segment'],
    ['#candidate-location', 'Location'],
    ['#account', 'Account'],
    ['#subprocess', 'Subprocess'],
    ['#recruiter-name', 'Name of Recruiter']
  ];
  const missingField = requiredFields.find(([selector]) => {
    const field = document.querySelector(selector);
    const selectedOption = field?.selectedOptions?.[0];
    if (selector === '#education-level' && field?.value === 'OTHERS') {
      return !educationOther?.value.trim();
    }
    if (selector === '#recruiter-name' && field?.value === 'Other') {
      return !recruiterOtherName?.value.trim();
    }
    return !field?.value.trim() || selectedOption?.disabled || (selector === '#candidate-location' && (!field.value || field.value === 'All Data'));
  });
  if (missingField) {
    const field = document.querySelector(missingField[0]);
    field?.focus();
    if (submitMessage) {
      submitMessage.textContent = `${missingField[1]} is required before submitting.`;
      submitMessage.classList.remove('run-success');
    }
    return;
  }
  const getValue = (selector) => {
    const field = document.querySelector(selector);
    const selectedOption = field?.selectedOptions?.[0];
    return selectedOption?.disabled ? '-' : (field?.value.trim() || '-');
  };
  const selectedLocation = candidateLocation?.value.trim() || '';
  historyTableBody.prepend(createHistoryRow({
    id: getValue('#candidate-id'),
    name: getValue('#workday-name'),
    email: getValue('#candidate-email'),
    location: selectedLocation || '-',
    status: getValue('#candidate-status'),
    mode: getValue('#assessment-mode'),
    education: educationLevel?.value === 'OTHERS' ? educationOther.value.trim() : getValue('#education-level'),
    segment: getValue('#segment'),
    account: getValue('#account'),
    subprocess: getValue('#subprocess'),
    recruiter: recruiterSelect?.value === 'Other' ? recruiterOtherName.value.trim() : getValue('#recruiter-name'),
    dateSeat: formatLocalDate(new Date())
  }, 1));
  renumberHistoryRows();
  refreshAssessmentNames();
  updateHistoryActions();
  saveHistory();
  window.localStorage?.removeItem(CANDIDATE_DRAFT_STORAGE_KEY);
  candidateForm.reset();
  candidateLocation.value = !locationFilter?.value || locationFilter.value === 'All Data' ? '' : locationFilter.value;
  updateRecruiterOptions();
  toggleEducationOther();
  toggleRecruiterOtherName();
  subprocessSelect?.dispatchEvent(new Event('change', { bubbles: true }));
  document.querySelectorAll('.searchable-select-input').forEach((input) => { input.value = ''; });
  if (submitMessage) submitMessage.textContent = 'Successfully submitted to endorsement.';
});

if (accountSelect && subprocessSelect) {
  let subprocessOptions = [...subprocessSelect.options]
    .filter((option) => !option.disabled && option.value)
    .map((option) => ({ value: option.value, text: option.textContent }));
  let accountSubprocessData = null;
  const cignaSharedSubprocesses = new Set(['MEDICAL PROVIDER', 'One Guide Proclaim', 'Centene Med D', 'PHL_PASSWORD RESET', 'PHL_CLICK 2 CHAT - ONE GUIDE', 'CLICK 2 CHAT - One Guide', 'CLICK 2 CHAT - Premium']);
  const accountAliases = {
    ACCREDO: ['ACCREDO'],
    BCI: ['BCI', 'BLUE CROSS OF IDAHO'],
    BROADPATH: ['BROADPATH', 'BGSI', 'HELP AT HOME', 'GRAVIE'],
    BSC: ['BSC'],
    CENTERWELL: ['CENTERWELL'],
    COHERE: ['COHERE'],
    CONVEY: ['CONVEY'],
    ENABLECOMP: ['WORKERS COMPENSATION'],
    ENLYTE: ['ENLYTE', 'APRICUS'],
    FLATIRON: ['FLATIRON', 'CLINICAL ABSTRACTION'],
    HCSC: ['HCSC'],
    MOILINA: ['MOLINA'],
    'PWC/COVENTRY': ['PWC', 'COVENTRY'],
    RADIOLOGY: ['RADIOLOGY', 'PATIENT BILLING', 'SCHEDULING', 'DESERT', 'JEFFERSON', 'ARA']
  };
  const getWorkbookAccountData = () => {
    try {
      const workbook = JSON.parse(window.localStorage?.getItem('thresholdWorkbookData') || '[]');
      const sheet = workbook.find((item) => Array.isArray(item.headers) && Array.isArray(item.rows));
      if (!sheet) return {};
      const accountIndex = sheet.headers.findIndex((header) => String(header).trim().toLowerCase() === 'account');
      const subprocessIndex = sheet.headers.findIndex((header) => String(header).trim().toLowerCase() === 'account subprocess');
      if (accountIndex < 0 || subprocessIndex < 0) return {};
      return sheet.rows.reduce((mapping, row) => {
        const account = String(row[accountIndex] ?? '').trim().toUpperCase();
        const subprocess = String(row[subprocessIndex] ?? '').trim();
        if (account && subprocess) {
          mapping[account] = mapping[account] || [];
          if (!mapping[account].includes(subprocess)) mapping[account].push(subprocess);
        }
        return mapping;
      }, {});
    } catch {
      return {};
    }
  };
  let workbookAccountData = getWorkbookAccountData();
  Object.keys(workbookAccountData).forEach((account) => {
    if ([...accountSelect.options].some((option) => option.value === account)) return;
    const option = document.createElement('option');
    option.value = account;
    option.textContent = account;
    accountSelect.appendChild(option);
  });
  subprocessOptions = [...new Map([
    ...subprocessOptions.map((option) => [option.value, option]),
    ...Object.values(workbookAccountData).flat().map((text) => [text, { value: text, text }])
  ]).values()];

  const searchableSelects = new Map();

  const createSearchableSelect = (select, emptyText) => {
    const container = select.parentElement;
    const searchInput = document.createElement('input');
    const clearButton = document.createElement('button');
    const optionsPopup = document.createElement('div');
    searchInput.type = 'text';
    searchInput.className = 'field searchable-select-input';
    searchInput.placeholder = emptyText;
    searchInput.setAttribute('aria-label', emptyText);
    searchInput.autocomplete = 'off';
    clearButton.type = 'button';
    clearButton.className = 'searchable-select-clear';
    clearButton.textContent = 'x';
    clearButton.setAttribute('aria-label', `Clear ${emptyText}`);
    optionsPopup.className = 'searchable-select-options';
    optionsPopup.hidden = true;
    select.hidden = true;
    container.classList.add('searchable-select-container');
    container.insertBefore(searchInput, select);
    container.appendChild(clearButton);
    container.appendChild(optionsPopup);

    const refresh = () => {
      searchInput.value = select.selectedOptions[0]?.disabled ? '' : (select.selectedOptions[0]?.textContent || '');
      searchInput.disabled = select.disabled;
      clearButton.hidden = !searchInput.value || searchInput.disabled;
    };

    const renderOptions = () => {
      const query = searchInput.value.trim().toLowerCase();
      const options = [...select.options].filter((option) => !option.disabled && option.value && option.textContent.toLowerCase().includes(query));
      optionsPopup.innerHTML = '';
      options.forEach((option) => {
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.className = 'searchable-select-option';
        optionButton.textContent = option.textContent;
        optionButton.addEventListener('mousedown', (event) => event.preventDefault());
        optionButton.addEventListener('click', () => {
          select.value = option.value;
          searchInput.value = option.textContent;
          optionsPopup.hidden = true;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        optionsPopup.appendChild(optionButton);
      });
      optionsPopup.hidden = options.length === 0;
    };

    searchInput.addEventListener('focus', renderOptions);
    searchInput.addEventListener('input', renderOptions);
    clearButton.addEventListener('click', () => {
      select.selectedIndex = 0;
      searchInput.value = '';
      optionsPopup.hidden = true;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      searchInput.focus();
    });
    select.addEventListener('change', refresh);
    document.addEventListener('click', (event) => {
      if (!container.contains(event.target)) optionsPopup.hidden = true;
    });
    refresh();
    searchableSelects.set(select, { refresh });
  };

  createSearchableSelect(accountSelect, 'Select Account');
  createSearchableSelect(subprocessSelect, 'Select Account Subprocess');
  if (assessmentCandidateName) createSearchableSelect(assessmentCandidateName, 'Select candidate name');
  refreshAssessmentNames();

  const updateSubprocessOptions = () => {
    const account = accountSelect.value.trim().toUpperCase();
    const currentValue = subprocessSelect.value;
    const mappedOptions = accountSubprocessData?.[account] || workbookAccountData[account];
    const matches = mappedOptions
      ? mappedOptions.map((text) => ({ value: text, text }))
      : subprocessOptions.filter((option) => {
        if (!account) return false;
        const subprocess = option.text.toUpperCase();
        if (account === 'CIGNA') return (subprocess.includes('CIGNA') && !subprocess.includes('ACCREDO')) || cignaSharedSubprocesses.has(option.text);
        const aliases = accountAliases[account] || [account];
        return aliases.some((alias) => subprocess.includes(alias));
      });

    subprocessSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.textContent = account ? `Select ${account} Subprocess` : 'Select Account Subprocess';
    placeholder.disabled = true;
    placeholder.selected = true;
    subprocessSelect.appendChild(placeholder);

    matches.forEach((option) => {
      const subprocessOption = document.createElement('option');
      subprocessOption.value = option.value;
      subprocessOption.textContent = option.text;
      subprocessSelect.appendChild(subprocessOption);
    });

    subprocessSelect.disabled = matches.length === 0;
    if (matches.some((option) => option.value === currentValue)) {
      subprocessSelect.value = currentValue;
    }
    searchableSelects.get(subprocessSelect)?.refresh();
  };

  accountSelect.addEventListener('change', updateSubprocessOptions);
  updateSubprocessOptions();
  window.addEventListener('thresholdWorkbookUpdated', () => {
    workbookAccountData = getWorkbookAccountData();
    updateSubprocessOptions();
  });

  fetch('../Recruiter-and-Admin-Portal-main%20(10)/Recruiter-and-Admin-Portal-main/script.js')
    .then((response) => response.ok ? response.text() : Promise.reject(new Error('Source data unavailable')))
    .then((source) => {
      const match = source.match(/const accountSubprocesses = (\{[\s\S]*?\});/);
      if (!match) throw new Error('Account data block not found');
      accountSubprocessData = {};
      const accountPattern = /([A-Z]+):\s*\[([^\]]*)\]/g;
      let accountMatch;
      while ((accountMatch = accountPattern.exec(match[1]))) {
        accountSubprocessData[accountMatch[1]] = [...accountMatch[2].matchAll(/'([^']*)'/g)].map((entry) => entry[1]);
      }
      if (!Object.keys(accountSubprocessData).length) throw new Error('No account mappings found');
      const currentAccount = accountSelect.value;
      accountSelect.innerHTML = '<option selected disabled>Select Account</option>';
      Object.keys(accountSubprocessData).forEach((accountName) => {
        const option = document.createElement('option');
        option.value = accountName;
        option.textContent = accountName;
        accountSelect.appendChild(option);
      });
      if (Object.prototype.hasOwnProperty.call(accountSubprocessData, currentAccount)) {
        accountSelect.value = currentAccount;
      }
      subprocessOptions = Object.values(accountSubprocessData).flat().map((text) => ({ value: text, text }));
      accountSelect.dispatchEvent(new Event('change', { bubbles: true }));
    })
    .catch(() => {
      // Keep the embedded fallback options when the source folder is not served with this page.
    });
}
