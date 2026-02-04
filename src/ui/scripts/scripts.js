const distinctToggle = document.getElementById('uniqueId');
const backgroundContainer = document.getElementById('groups');
const foregroundContainer = document.getElementById('foreground-groups');
const foregroundColumn = document.getElementById('foreground-groups-column');
const backgroundLabel = document.querySelector('[data-role="background-label"]');
const foregroundLabel = document.querySelector('[data-role="foreground-label"]');
const generateButton = document.getElementById('generate-grid');

const setGeneratingState = (isGenerating) => {
  if (!generateButton) {
    return;
  }

  generateButton.disabled = isGenerating;
  generateButton.textContent = isGenerating ? 'Generating...' : 'Generate Matrix';
};

let availableGroups = {};

const getCheckedGroups = (container) => {
  const selected = [];
  container?.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    if (checkbox.checked) {
      const groupName = checkbox.dataset.group || checkbox.name || checkbox.id;
      selected.push(groupName);
    }
  });
  return selected;
};

const renderGroupCheckboxes = (groups, container, prefix, preselected = []) => {
  if (!container) {
    return;
  }

  const selectedSet = new Set(preselected);
  container.innerHTML = '';

  Object.keys(groups).forEach((groupName) => {
    const boxDiv = document.createElement('div');
    boxDiv.className = 'checkbox';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox__box';
    checkbox.id = `${prefix}-${groupName}`;
    checkbox.name = `${prefix}-${groupName}`;
    checkbox.dataset.group = groupName;
    checkbox.checked = selectedSet.has(groupName);

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = groupName;
    label.className = 'checkbox__label';

    boxDiv.appendChild(checkbox);
    boxDiv.appendChild(label);
    container.appendChild(boxDiv);
  });
};

const updateGroupLabels = (isDistinct) => {
  if (backgroundLabel) {
    backgroundLabel.textContent = isDistinct ? 'Background' : 'Background & Text';
  }
  if (foregroundLabel) {
    foregroundLabel.textContent = 'Text';
  }
  foregroundColumn?.classList.toggle('is-hidden', !isDistinct);
};

const hasAvailableGroups = () => Object.keys(availableGroups || {}).length > 0;

distinctToggle?.addEventListener('change', () => {
  if (!hasAvailableGroups()) {
    updateGroupLabels(distinctToggle.checked);
    return;
  }

  const isDistinct = distinctToggle.checked;
  updateGroupLabels(isDistinct);

  if (isDistinct) {
    const backgroundSelection = getCheckedGroups(backgroundContainer);
    const existingForegroundSelection = getCheckedGroups(foregroundContainer);
    const initialSelection = existingForegroundSelection.length
      ? existingForegroundSelection
      : backgroundSelection;

    renderGroupCheckboxes(availableGroups, foregroundContainer, 'fg', initialSelection);
  } else {
    const combined = new Set([
      ...getCheckedGroups(backgroundContainer),
      ...getCheckedGroups(foregroundContainer),
    ]);

    renderGroupCheckboxes(availableGroups, backgroundContainer, 'bg', Array.from(combined));
  }
});

window.onmessage = (event) => {
  const { pluginMessage } = event.data;
  if (!pluginMessage) {
    return;
  }

  if (pluginMessage.type === 'generation-error') {
    setGeneratingState(false);
    return;
  }

  if (!pluginMessage.groups) {
    return;
  }

  availableGroups = pluginMessage.groups;

  const currentBackgroundSelection = getCheckedGroups(backgroundContainer);
  const currentForegroundSelection = getCheckedGroups(foregroundContainer);

  renderGroupCheckboxes(availableGroups, backgroundContainer, 'bg', currentBackgroundSelection);
  renderGroupCheckboxes(availableGroups, foregroundContainer, 'fg', currentForegroundSelection.length ? currentForegroundSelection : currentBackgroundSelection);

  updateGroupLabels(distinctToggle?.checked ?? false);
};

generateButton.onclick = () => {
  if (!generateButton || generateButton.disabled) {
    return;
  }

  setGeneratingState(true);

  const aaa = document.getElementById('aaa').checked;
  const aa = document.getElementById('aa').checked;
  const aa18 = document.getElementById('aa18').checked;
  const dnp = document.getElementById('dnp').checked;
  const fullName = document.getElementById('full-name').checked;
  const baseColorHex = document.getElementById('base-color').value;
  const useDistinct = distinctToggle?.checked ?? false;

  const selectedBackgroundGroups = getCheckedGroups(backgroundContainer);
  const selectedForegroundGroups = useDistinct
    ? getCheckedGroups(foregroundContainer)
    : [...selectedBackgroundGroups];

  const array = {
    aaa,
    aa,
    aa18,
    dnp,
    fullName,
    useDistinct,
    selectedBackgroundGroups,
    selectedForegroundGroups,
  };

  parent.postMessage(
    { pluginMessage: { type: 'generate-grid', array, baseColorHex } },
    '*',
  );
};

// Close plugin on button click
document.getElementById('close').onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
};

selectMenu.init();
