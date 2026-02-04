<script>
  import { Button, Checkbox, Input, Label, Switch, Text } from "figma-ui3-kit-svelte";

  let isDistinct = false;
  let availableGroups = {};
  let backgroundSelection = [];
  let foregroundSelection = [];
  let isGenerating = false;

  // Display options
  let showAAA = true;
  let showAA = true;
  let showAA18 = true;
  let showDNP = true;
  let showFullName = false;
  let baseColor = "#FFFFFF";

  $: groupNames = Object.keys(availableGroups);
  $: hasGroups = groupNames.length > 0;

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

  function handleGenerate() {
    isGenerating = true;
    const selectedBackgroundGroups = backgroundSelection;
    const selectedForegroundGroups = isDistinct
      ? foregroundSelection
      : [...backgroundSelection];

    parent.postMessage(
      {
        pluginMessage: {
          type: "generate-grid",
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
        },
      },
      "*",
    );
  }

  function handleClose() {
    parent.postMessage({ pluginMessage: { type: "close" } }, "*");
  }

  window.onmessage = (event) => {
    const msg = event.data?.pluginMessage;
    if (!msg) return;

    if (msg.type === "generation-error") {
      isGenerating = false;
      return;
    }

    if (msg.groups) {
      availableGroups = msg.groups;
      // Select all by default
      if (backgroundSelection.length === 0) {
        backgroundSelection = Object.keys(msg.groups);
        foregroundSelection = Object.keys(msg.groups);
      }
    }
  };
</script>

<div class="wrapper">
  <div class="main">
    <div class="section">
      <Switch bind:checked={isDistinct}>Distinct rows and columns</Switch>
    </div>

    <div class="groups-container">
      <div class="group-column">
        <Label>{isDistinct ? "Background" : "Background & Text"}</Label>
        {#if hasGroups}
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
        {:else}
          <Text variant="body-small" color="secondary">Loading groups...</Text>
        {/if}
      </div>

      {#if isDistinct}
        <div class="group-column">
          <Label>Text</Label>
          {#if hasGroups}
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
          {/if}
        </div>
      {/if}
    </div>

    <div class="section">
      <Label>Display options</Label>
      <div class="display-options">
        <Checkbox bind:checked={showAAA}>AAA</Checkbox>
        <Checkbox bind:checked={showAA}>AA</Checkbox>
        <Checkbox bind:checked={showAA18}>AA Large</Checkbox>
        <Checkbox bind:checked={showDNP}>DNP</Checkbox>
      </div>
      <Checkbox bind:checked={showFullName}>Show full name</Checkbox>
    </div>

    <div class="section">
      <Label>Base color</Label>
      <Input bind:value={baseColor} placeholder="#FFFFFF" />
    </div>
  </div>

  <footer>
    <Button variant="secondary" on:click={handleClose}>Cancel</Button>
    <Button
      variant="primary"
      on:click={handleGenerate}
      disabled={isGenerating || backgroundSelection.length === 0}
    >
      {isGenerating ? "Generating..." : "Generate Matrix"}
    </Button>
  </footer>
</div>

<style>
  .wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    padding: var(--size-xxsmall);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--size-xsmall);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxxsmall);
  }

  .groups-container {
    display: flex;
    gap: var(--size-xsmall);
  }

  .group-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--size-xxxsmall);
  }

  .checkboxes {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxxsmall);
  }

  .display-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-xsmall);
  }

  footer {
    display: flex;
    gap: var(--size-xxsmall);
    padding: var(--size-xxsmall);
    border-top: 1px solid var(--figma-color-border);
    justify-content: flex-end;
  }
</style>
