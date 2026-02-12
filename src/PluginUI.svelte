<script>
  import {
    Button,
    Checkbox,
    Dropdown,
    IconButton,
    Input,
    Modal,
    Switch,
  } from "figma-ui3-kit-svelte";
  // @ts-ignore - Direct import until kit exports this icon
  import IconSettingsSmall from "../node_modules/figma-ui3-kit-svelte/src/icons/24/icon.24.settings.small.svg";
  import {
    PluginLayout,
    Header,
    FieldGroup,
    Footer,
    LoadingState,
    EmptyState,
    sendToPlugin,
  } from "figma-plugin-utilities";

  let isLoading = true;
  let isDistinct = false;
  let availableGroups = {};
  let backgroundSelection = [];
  let foregroundSelection = [];
  let isGenerating = false;
  let showSettings = false;

  // Snapshot for cancel (revert unsaved changes)
  let settingsSnapshot = null;

  // Mode selection
  let collectionModes = [];
  let selectedModes = {};

  // Display options
  let showAAA = true;
  let showAA = true;
  let showAA18 = true;
  let showDNP = true;
  let showFullName = false;
  let baseColor = "#FFFFFF";

  $: groupNames = Object.keys(availableGroups);
  $: hasGroups = groupNames.length > 0;
  $: hasMultipleModes = collectionModes.length > 0;

  function initModeSelections(modes) {
    modes.forEach((cm) => {
      const defaultMode =
        cm.modes.find((m) => m.modeId === cm.defaultModeId) || cm.modes[0];
      selectedModes[cm.collectionId] = {
        label: defaultMode.name,
        value: defaultMode.modeId,
      };
    });
    selectedModes = selectedModes;
  }

  function toggleBackgroundGroup(name) {
    if (backgroundSelection.includes(name)) {
      backgroundSelection = backgroundSelection.filter((g) => g !== name);
    } else {
      backgroundSelection = [...backgroundSelection, name];
    }
  }

  function toggleForegroundGroup(name) {
    if (foregroundSelection.includes(name)) {
      foregroundSelection = foregroundSelection.filter((g) => g !== name);
    } else {
      foregroundSelection = [...foregroundSelection, name];
    }
  }

  function openSettings() {
    settingsSnapshot = {
      showAAA,
      showAA,
      showAA18,
      showDNP,
      showFullName,
      baseColor,
    };
    showSettings = true;
  }

  function handleCancel() {
    if (settingsSnapshot) {
      showAAA = settingsSnapshot.showAAA;
      showAA = settingsSnapshot.showAA;
      showAA18 = settingsSnapshot.showAA18;
      showDNP = settingsSnapshot.showDNP;
      showFullName = settingsSnapshot.showFullName;
      baseColor = settingsSnapshot.baseColor;
    }
    showSettings = false;
    settingsSnapshot = null;
  }

  function handleSave() {
    sendToPlugin("persist-settings", {
      settings: {
        showAAA,
        showAA,
        showAA18,
        showDNP,
        showFullName,
        baseColor,
      },
    });
    showSettings = false;
    settingsSnapshot = null;
  }

  function handleGenerate() {
    isGenerating = true;
    const selectedBackgroundGroups = backgroundSelection;
    const selectedForegroundGroups = isDistinct
      ? foregroundSelection
      : [...backgroundSelection];

    const modesArray = Object.entries(selectedModes).map(
      ([collectionId, selection]) => ({
        collectionId,
        modeId: selection.value,
      }),
    );

    sendToPlugin("generate-grid", {
      array: {
        aaa: showAAA,
        aa: showAA,
        aa18: showAA18,
        dnp: showDNP,
        fullName: showFullName,
        useDistinct: isDistinct,
        selectedBackgroundGroups,
        selectedForegroundGroups,
      },
      baseColorHex: baseColor,
      selectedModes: modesArray,
    });
  }

  // Custom handler needed - backend sends groups as property, not type
  window.onmessage = (event) => {
    const msg = event.data?.pluginMessage;
    if (!msg) return;

    if (msg.type === "generation-error") {
      isGenerating = false;
      return;
    }

    if (msg.groups) {
      availableGroups = msg.groups;
      isLoading = false;
    }

    if (msg.collectionModes) {
      collectionModes = msg.collectionModes;
      initModeSelections(collectionModes);
    }

    if (msg.settings) {
      const s = msg.settings;
      if (typeof s.showAAA === "boolean") showAAA = s.showAAA;
      if (typeof s.showAA === "boolean") showAA = s.showAA;
      if (typeof s.showAA18 === "boolean") showAA18 = s.showAA18;
      if (typeof s.showDNP === "boolean") showDNP = s.showDNP;
      if (typeof s.showFullName === "boolean") showFullName = s.showFullName;
      if (typeof s.baseColor === "string") baseColor = s.baseColor;
    }
  };
</script>

<div class="plugin-container">
  <Modal
    isOpen={showSettings}
    title="Settings"
    position="bottom"
    height="260px"
    overlayPadding="0px"
    onClose={handleCancel}
  >
    <div class="modal-content">
      <FieldGroup label="Display options">
        <div class="display-options">
          <Checkbox bind:checked={showAAA}>AAA</Checkbox>
          <Checkbox bind:checked={showAA}>AA</Checkbox>
          <Checkbox bind:checked={showAA18}>AA Large</Checkbox>
          <Checkbox bind:checked={showDNP}>DNP</Checkbox>
        </div>
        <Checkbox bind:checked={showFullName}>Show full name</Checkbox>
      </FieldGroup>

      <FieldGroup label="Base color">
        <Input bind:value={baseColor} placeholder="#FFFFFF" />
      </FieldGroup>
    </div>
    <svelte:fragment slot="footer-left">
      <Button variant="secondary" on:click={handleCancel}>Cancel</Button>
    </svelte:fragment>
    <svelte:fragment slot="footer-right">
      <Button variant="primary" on:click={handleSave}>Save</Button>
    </svelte:fragment>
  </Modal>

  {#if isLoading}
    <LoadingState message="Loading color variables..." />
  {:else if !hasGroups}
    <EmptyState message="No color variables found. Add color variables to your file to generate a contrast matrix." />
  {:else}
    <PluginLayout>
      {#if hasMultipleModes}
        {#each collectionModes as cm}
          <FieldGroup
            label={collectionModes.length > 1
              ? `Mode · ${cm.collectionName}`
              : "Mode"}
          >
            <Dropdown
              menuItems={cm.modes.map((m) => ({
                label: m.name,
                value: m.modeId,
              }))}
              bind:value={selectedModes[cm.collectionId]}
            />
          </FieldGroup>
        {/each}
      {/if}

      <div class="groups-container">
        <FieldGroup label={isDistinct ? "Background" : "Background & Foreground"}>
          <div class="checkboxes">
            {#each groupNames as name}
              <Checkbox
                checked={backgroundSelection.includes(name)}
                on:change={() => toggleBackgroundGroup(name)}
              >
                {name}
              </Checkbox>
            {/each}
          </div>
        </FieldGroup>

        {#if isDistinct}
          <FieldGroup label="Foreground">
            <div class="checkboxes">
              {#each groupNames as name}
                <Checkbox
                  checked={foregroundSelection.includes(name)}
                  on:change={() => toggleForegroundGroup(name)}
                >
                  {name}
                </Checkbox>
              {/each}
            </div>
          </FieldGroup>
        {/if}
      </div>

      <FieldGroup>
        <Switch bind:checked={isDistinct}>Distinct rows and columns</Switch>
      </FieldGroup>
    </PluginLayout>

    <Footer variant="split">
      <svelte:fragment slot="left">
        <Button
          variant="primary"
          on:click={handleGenerate}
          disabled={isGenerating || backgroundSelection.length === 0}
          fullWidth
        >
          {isGenerating ? "Generating..." : "Generate matrix"}
        </Button>
      </svelte:fragment>
      <svelte:fragment slot="right">
        <IconButton iconName={IconSettingsSmall} on:click={openSettings} />
      </svelte:fragment>
    </Footer>
  {/if}
</div>

<style>
  .plugin-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxsmall);
  }

  .groups-container {
    display: flex;
    gap: var(--size-xxsmall);
  }
  .groups-container > :global(*) {
    flex: 1;
    min-width: 0;
  }

  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxxsmall);
    border: 1px solid var(--figma-color-border);
    border-radius: var(--border-radius-medium);
    padding: var(--size-xxsmall);
    height: 160px;
    overflow-y: auto;
  }

  .display-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-xsmall);
  }
</style>
