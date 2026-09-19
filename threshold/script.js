const STORAGE_KEY = 'thresholdWorkbookData';

const clearButton = document.querySelector('#clear-button');
const addRowButton = document.querySelector('#add-row-button');
const rowEditor = document.querySelector('#row-editor');
const rowEditorTitle = document.querySelector('#row-editor-title');
const rowEditorFields = document.querySelector('#row-editor-fields');
const cancelRowButton = document.querySelector('#cancel-row-button');
const searchInput = document.querySelector('#table-search');
const sheetTabs = document.querySelector('#sheet-tabs');
const table = document.querySelector('#data-table');
const tableHead = table.querySelector('thead');
const tableBody = table.querySelector('tbody');
const emptyState = document.querySelector('#empty-state');
const tableSummary = document.querySelector('#table-summary');
const importMessage = document.querySelector('#import-message');
const storageStatus = document.querySelector('#storage-status');

let workbookData = [];
let activeSheetIndex = 0;

const saveWorkbook = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workbookData));
  localStorage.setItem('thresholdWorkbookUpdatedAt', String(Date.now()));
  Promise.resolve(window.firebaseSync?.saveThreshold(workbookData)).catch((error) => console.error('Firebase threshold sync failed', error));
  storageStatus.textContent = `${workbookData.length} sheet${workbookData.length === 1 ? '' : 's'} saved locally and synced`;
};

const setMessage = (message, isError = false) => {
  importMessage.textContent = message;
  importMessage.classList.toggle('error', isError);
};

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

const renderTabs = () => {
  sheetTabs.replaceChildren();
  workbookData.forEach((sheet, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `sheet-tab${index === activeSheetIndex ? ' active' : ''}`;
    tab.textContent = `${sheet.name} (${sheet.rows.length})`;
    tab.addEventListener('click', () => {
      activeSheetIndex = index;
      searchInput.value = '';
      renderTabs();
      renderTable();
    });
    sheetTabs.appendChild(tab);
  });
};

const renderTable = () => {
  tableHead.replaceChildren();
  tableBody.replaceChildren();
  const sheet = workbookData[activeSheetIndex];
  if (!sheet) {
    emptyState.hidden = false;
    table.hidden = true;
    tableSummary.textContent = 'Import a workbook to see its data here.';
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const visibleRows = sheet.rows.filter((row) => !query || row.some((value) => String(value).toLowerCase().includes(query)));
  const letterRow = document.createElement('tr');
  letterRow.className = 'column-letter-row';
  const cornerCell = document.createElement('th');
  cornerCell.className = 'coordinate-corner';
  cornerCell.textContent = '';
  letterRow.appendChild(cornerCell);
  sheet.headers.forEach((_, index) => {
    const cell = document.createElement('th');
    cell.className = 'column-letter';
    cell.textContent = getColumnLabel(index + 1);
    cell.setAttribute('aria-label', `Column ${getColumnLabel(index + 1)}`);
    letterRow.appendChild(cell);
  });
  tableHead.appendChild(letterRow);
  const headerRow = document.createElement('tr');
  const rowHeader = document.createElement('th');
  rowHeader.className = 'row-number-heading';
  rowHeader.textContent = '#';
  headerRow.appendChild(rowHeader);
  sheet.headers.forEach((header) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = header;
    headerRow.appendChild(cell);
  });
  tableHead.appendChild(headerRow);

  visibleRows.forEach((row) => {
    const tableRow = document.createElement('tr');
    const rowNumber = document.createElement('th');
    rowNumber.className = 'row-number';
    rowNumber.scope = 'row';
    rowNumber.textContent = String(sheet.rows.indexOf(row) + 2);
    tableRow.appendChild(rowNumber);
    row.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      tableRow.appendChild(cell);
    });
    tableBody.appendChild(tableRow);
  });

  emptyState.hidden = visibleRows.length > 0;
  emptyState.textContent = query ? 'No matching rows.' : 'This sheet has no data rows.';
  table.hidden = false;
  tableSummary.textContent = `${sheet.name}: ${visibleRows.length} of ${sheet.rows.length} rows, ${sheet.headers.length} columns`;
};

const closeRowEditor = () => {
  if (rowEditor) rowEditor.hidden = true;
  rowEditorFields?.replaceChildren();
};

const openRowEditor = () => {
  const sheet = workbookData[activeSheetIndex];
  if (!sheet) {
    setMessage('Load or restore a workbook before adding a row.', true);
    return;
  }
  rowEditorTitle.textContent = `Add row to ${sheet.name}`;
  rowEditorFields.replaceChildren(...sheet.headers.map((header, index) => {
    const label = document.createElement('label');
    label.className = 'row-editor-field';
    label.textContent = header;
    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.columnIndex = String(index);
    input.autocomplete = 'off';
    label.appendChild(input);
    return label;
  }));
  rowEditor.hidden = false;
  rowEditorFields.querySelector('input')?.focus();
};

rowEditor?.addEventListener('submit', (event) => {
  event.preventDefault();
  const sheet = workbookData[activeSheetIndex];
  if (!sheet) return;
  const row = [...rowEditorFields.querySelectorAll('input')].map((input) => input.value.trim());
  if (!row.some(Boolean)) {
    setMessage('Enter at least one value before adding the row.', true);
    return;
  }
  sheet.rows.push(row);
  saveWorkbook();
  renderTabs();
  renderTable();
  closeRowEditor();
  setMessage(`Added a row to ${sheet.name}. The workbook is synced across devices.`);
});

const restoreWorkbook = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved) || !saved.length) return;
    workbookData = saved;
    storageStatus.textContent = `${saved.length} sheet${saved.length === 1 ? '' : 's'} restored`;
    renderTabs();
    renderTable();
    setMessage('Restored the previously imported workbook from this browser.');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
};

window.applyRemoteThresholdWorkbook = (savedWorkbook) => {
  if (!Array.isArray(savedWorkbook)) return;
  workbookData = savedWorkbook;
  activeSheetIndex = 0;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workbookData));
  storageStatus.textContent = `${workbookData.length} sheet${workbookData.length === 1 ? '' : 's'} restored from Firebase`;
  renderTabs();
  renderTable();
  setMessage('Threshold workbook synced from Firebase.');
};

window.getLocalThresholdWorkbook = () => {
  try {
    const savedWorkbook = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(savedWorkbook) ? savedWorkbook : [];
  } catch {
    return [];
  }
};

addRowButton.addEventListener('click', openRowEditor);
cancelRowButton.addEventListener('click', closeRowEditor);
searchInput.addEventListener('input', renderTable);
clearButton.addEventListener('click', () => {
  workbookData = [];
  activeSheetIndex = 0;
  localStorage.removeItem(STORAGE_KEY);
  sheetTabs.replaceChildren();
  storageStatus.textContent = 'No workbook loaded';
  setMessage('Stored threshold data cleared.');
  Promise.resolve(window.firebaseSync?.saveThreshold([])).catch((error) => console.error('Firebase threshold sync failed', error));
  renderTable();
});

restoreWorkbook();
renderTable();
