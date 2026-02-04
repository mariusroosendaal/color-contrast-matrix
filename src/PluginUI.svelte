<script>
  import { Button, Checkbox, Input, Switch } from "figma-ui3-kit-svelte";
  import {
    PluginLayout,
    Header,
    FieldGroup,
    Footer,
    LoadingState,
    sendToPlugin,
  } from "figma-plugin-utils";

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
    });
  }

  function handleClose() {
    sendToPlugin("close");
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
      // Select all by default
      if (backgroundSelection.length === 0) {
        backgroundSelection = Object.keys(msg.groups);
        foregroundSelection = Object.keys(msg.groups);
      }
    }
  };
</script>

<div class="plugin-container">
  <Header title="Color Contrast Matrix" />

  <PluginLayout>
    <FieldGroup>
      <Switch bind:checked={isDistinct}>Distinct rows and columns</Switch>
    </FieldGroup>

    <div class="groups-container">
      <FieldGroup label={isDistinct ? "Background" : "Background & Text"}>
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
          <LoadingState message="Loading groups..." size="small" />
        {/if}
      </FieldGroup>

      {#if isDistinct}
        <FieldGroup label="Text">
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
        </FieldGroup>
      {/if}
    </div>

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
  </PluginLayout>

  <Footer variant="split">
    <svelte:fragment slot="left">
      <Button variant="secondary" on:click={handleClose}>Cancel</Button>
    </svelte:fragment>
    <svelte:fragment slot="right">
      <Button
        variant="primary"
        on:click={handleGenerate}
        disabled={isGenerating || backgroundSelection.length === 0}
      >
        {isGenerating ? "Generating..." : "Generate Matrix"}
      </Button>
    </svelte:fragment>
  </Footer>
</div>

<style>
  .plugin-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .groups-container {
    display: flex;
    gap: var(--size-xsmall);
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
</style>
