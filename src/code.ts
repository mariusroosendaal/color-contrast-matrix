figma.showUI(__html__, { themeColors: true, width: 360, height: 480 });

figma.loadFontAsync({ family: "IBM Plex Mono", style: "Regular" });
figma.loadFontAsync({ family: "Inter", style: "Regular" });

interface ColorVariable {
  name: string;
  collection: string;
  variable: Variable;
}

class Tile {
  instance: InstanceNode;
  backgroundColor: ColorVariable;
  foregroundColor: ColorVariable;
  baseColor: RGB;

  constructor(
    instance: InstanceNode,
    backgroundColor: ColorVariable,
    foregroundColor: ColorVariable,
    baseColor: RGB,
  ) {
    this.instance = instance;
    this.backgroundColor = backgroundColor;
    this.foregroundColor = foregroundColor;
    this.baseColor = baseColor;
  }

  async toHexValue(variable: Variable, consumer: SceneNode): Promise<string> {
    const resolved = variable.resolveForConsumer(consumer);

    if (resolved.resolvedType === "COLOR") {
      const { r, g, b } = resolved.value as RGB;
      // Convert RGB to Hex
      const toHex = (c: number) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    return "#000000"; // Default to black if not a color
  }

  applyColors(fullName: boolean) {
    const fills = this.instance.fills as SolidPaint[];

    if (fills && fills.length > 0 && fills[0].type === "SOLID") {
      const updatedFill = figma.variables.setBoundVariableForPaint(
        fills[0],
        "color",
        this.backgroundColor.variable,
      );
      this.instance.fills = [updatedFill];
    }

    const tileText = this.instance.findOne(
      (node) => node.name === "text",
    ) as TextNode;
    if (tileText) {
      const displayName = fullName
        ? this.foregroundColor.name.replace("/", " ")
        : this.foregroundColor.name.split("/")[1] || this.foregroundColor.name;

      tileText.characters = displayName.toLowerCase();

      //const groupName = this.foregroundColor.name.split('/')[1] || this.foregroundColor.name;
      //tileText.characters = groupName;
    }

    const textFills = tileText.fills as SolidPaint[];
    if (textFills && textFills.length > 0 && textFills[0].type === "SOLID") {
      if (this.instance.name === "gridHeaderTile") {
        const backgroundRGB = this.backgroundColor.variable.resolveForConsumer(
          this.instance,
        ).value as RGBA;
        const bgPaint = {
          color: { r: backgroundRGB.r, g: backgroundRGB.g, b: backgroundRGB.b },
          opacity: backgroundRGB.a,
        } as SolidPaint;
        const blendedBgColor = this.getBlendedColor(bgPaint, 1, this.baseColor); // Blended background color

        this.applyTextColor(tileText, blendedBgColor);

        const hexText = this.instance.findOne(
          (node) => node.name === "hex",
        ) as TextNode;
        if (hexText) {
          this.toHexValue(this.foregroundColor.variable, this.instance).then(
            (hex) => {
              hexText.characters =
                backgroundRGB.a < 1
                  ? `${hex} ${Math.round(backgroundRGB.a * 100)}%`.toUpperCase()
                  : hex.toUpperCase();
              this.applyTextColor(hexText, blendedBgColor);
            },
          );
        }
      } else {
        const updatedTextFill = figma.variables.setBoundVariableForPaint(
          textFills[0],
          "color",
          this.foregroundColor.variable,
        );
        tileText.fills = [updatedTextFill];
      }
    }
  }

  applyTextColor(textNode: TextNode, backgroundRGB: RGB) {
    const blackRGB = { r: 0, g: 0, b: 0 };
    const whiteRGB = { r: 1, g: 1, b: 1 };

    const blackContrast = this.getContrast(
      { color: blackRGB, opacity: 1 } as SolidPaint,
      { color: backgroundRGB, opacity: 1 } as SolidPaint,
      this.baseColor,
    );
    const whiteContrast = this.getContrast(
      { color: whiteRGB, opacity: 1 } as SolidPaint,
      { color: backgroundRGB, opacity: 1 } as SolidPaint,
      this.baseColor,
    );

    // Ensure minimum contrast of 4.5:1
    let textColor = blackRGB; // Default to black

    if (blackContrast < 4.5 && whiteContrast >= 4.5) {
      textColor = whiteRGB;
    } else if (blackContrast >= whiteContrast && blackContrast >= 4.5) {
      textColor = blackRGB;
    } else if (whiteContrast > blackContrast) {
      textColor = whiteRGB;
    }

    textNode.fills = [{ type: "SOLID", color: textColor }];
  }

  applyContrastLabel() {
    const bgPaint = this.instance.fills[0] as SolidPaint;
    const tileText = this.instance.findOne(
      (node) => node.name === "text",
    ) as TextNode;
    const fgPaint = tileText.fills[0] as SolidPaint;

    const contrast = this.getContrast(fgPaint, bgPaint, this.baseColor);
    const ratioLabel = this.instance.findOne(
      (node) => node.name === "ratio",
    ) as TextNode;

    if (ratioLabel && ratioLabel.type === "TEXT") {
      ratioLabel.characters = contrast.toFixed(2) + ":1";

      // Apply text color to the ratio label based on the blended colors
      const blendedBgColor = this.getBlendedColor(bgPaint, 1, this.baseColor); // Blended background color
      this.applyTextColor(ratioLabel, blendedBgColor);
    }

    return contrast;
  }

  getBlendedColor(paint: SolidPaint, baseOpacity: number, baseColor: RGB): RGB {
    //console.log('Blend... ', baseColor);
    //const baseColor = { r: 1, g: 1, b: 1 }; // Base color (white)
    const bgColor = paint.color;
    const bgOpacity = paint.opacity !== undefined ? paint.opacity : 1;

    return {
      r: bgColor.r * bgOpacity + baseColor.r * (1 - bgOpacity),
      g: bgColor.g * bgOpacity + baseColor.g * (1 - bgOpacity),
      b: bgColor.b * bgOpacity + baseColor.b * (1 - bgOpacity),
    };
  }

  applyVariant(contrast: number) {
    const label = this.instance.findOne(
      (node) => node.name === "label",
    ) as InstanceNode;
    if (label) {
      label.setProperties({ "Property 1": this.getContrastVariant(contrast) });
    }
  }

  checkAndHideTile() {
    this.instance.fills = [];
    const nestedLayers = this.instance.findAll(
      (node) => node !== this.instance,
    );
    nestedLayers.forEach((layer) => (layer.visible = false));
  }

  getRelativeLuminance(r: number, g: number, b: number): number {
    const linear = (x: number) =>
      x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  }

  getContrast(
    foreground: SolidPaint,
    background: SolidPaint,
    baseColor: RGB,
  ): number {
    //console.log('Get Contrast... ', baseColor);

    const fgColor = foreground.color;
    const bgColor = background.color;

    const fgOpacity = foreground.opacity !== undefined ? foreground.opacity : 1;
    const bgOpacity = background.opacity !== undefined ? background.opacity : 1;

    // Assume a base color for the canvas (defaulting to white)
    //const baseColor = { r: 1, g: 1, b: 1 };

    // Blend the background color with the base color (typically white) using bgOpacity
    const blendedBgColor = {
      r: bgColor.r * bgOpacity + baseColor.r * (1 - bgOpacity),
      g: bgColor.g * bgOpacity + baseColor.g * (1 - bgOpacity),
      b: bgColor.b * bgOpacity + baseColor.b * (1 - bgOpacity),
    };
    //console.log('Get Contrast > Blended... ', blendedBgColor);

    // Blend the foreground color with the blended background color using fgOpacity
    const blendedFgColor = {
      r: fgColor.r * fgOpacity + blendedBgColor.r * (1 - fgOpacity),
      g: fgColor.g * fgOpacity + blendedBgColor.g * (1 - fgOpacity),
      b: fgColor.b * fgOpacity + blendedBgColor.b * (1 - fgOpacity),
    };

    // Calculate luminance and contrast using the final blended foreground and background
    const blendedFgLuminance = this.getRelativeLuminance(
      blendedFgColor.r,
      blendedFgColor.g,
      blendedFgColor.b,
    );
    const blendedBgLuminance = this.getRelativeLuminance(
      blendedBgColor.r,
      blendedBgColor.g,
      blendedBgColor.b,
    );
    const [bright, dark] =
      blendedFgLuminance > blendedBgLuminance
        ? [blendedFgLuminance, blendedBgLuminance]
        : [blendedBgLuminance, blendedFgLuminance];

    return (bright + 0.05) / (dark + 0.05);
  }

  getContrastVariant(contrast: number): string {
    if (contrast >= 7) return "aaa";
    if (contrast >= 4.5) return "aa";
    if (contrast >= 3) return "aa18";
    return "dnp";
  }

  processTile(array: {
    aaa: boolean;
    aa: boolean;
    aa18: boolean;
    dnp: boolean;
  }) {
    if (this.backgroundColor.variable.id === this.foregroundColor.variable.id) {
      this.checkAndHideTile();
      return;
    }

    const contrast = this.applyContrastLabel();
    this.applyVariant(contrast);

    if (
      (!array.aaa && contrast >= 7) ||
      (!array.aa && contrast >= 4.5 && contrast < 7) ||
      (!array.aa18 && contrast >= 3 && contrast < 4.5) ||
      (!array.dnp && contrast < 3)
    ) {
      this.checkAndHideTile();
    }
  }
}

class ColorMatrixGenerator {
  backgroundColors: ColorVariable[];
  foregroundColors: ColorVariable[];
  gridTileComponent: ComponentNode | null;

  constructor() {
    this.backgroundColors = [];
    this.foregroundColors = [];
    // this.gridTileComponent = await figma.importComponentByKeyAsync('f9ab15001530fa4cc6360b7f1742dc71f16a7add');
    //this.gridTileComponent = figma.currentPage.findOne(node => node.name === 'gridTile') as ComponentNode;
  }

  async getColorVariables(): Promise<ColorVariable[]> {
    const collections =
      await figma.variables.getLocalVariableCollectionsAsync();
    const colorVariables: ColorVariable[] = [];

    for (const collection of collections) {
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);

        if (variable.resolvedType === "COLOR") {
          colorVariables.push({
            name: variable.name,
            collection: collection.name,
            variable: variable,
          });
        }
      }
    }
    return colorVariables;
  }

  groupVariablesByPrefix(
    variables: ColorVariable[],
  ): Record<string, ColorVariable[]> {
    const groups: Record<string, ColorVariable[]> = {};

    variables.forEach((variable) => {
      const [group] = variable.name.split("/");
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(variable);
    });

    return groups;
  }

  createFrame(
    layoutMode: "HORIZONTAL" | "VERTICAL",
    name: string,
    itemSpacing: number,
    horPad: number,
    verPad: number,
    baseColor: RGB,
  ): FrameNode {
    const frame = figma.createFrame();
    frame.layoutMode = layoutMode;
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.itemSpacing = itemSpacing;
    frame.horizontalPadding = horPad;
    frame.verticalPadding = verPad;
    frame.name = name;
    frame.fills = [{ type: "SOLID", color: baseColor }];
    return frame;
  }

  async generateMatrix(
    backgroundGroups: string[],
    foregroundGroups: string[],
    array: {
      aaa: boolean;
      aa: boolean;
      aa18: boolean;
      dnp: boolean;
      fullName: boolean;
      useDistinct: boolean;
    },
    baseColorHex: string,
  ) {
    if (!backgroundGroups.length || !foregroundGroups.length) {
      figma.notify(
        "Select at least one variable group to generate the matrix.",
        { error: true },
      );
      figma.ui.postMessage({
        type: "generation-error",
        reason: "empty-selection",
      });
      return;
    }

    const allVariables = await this.getColorVariables();
    const groupedVariables = this.groupVariablesByPrefix(allVariables);

    const hexToRgb = (hex: string): RGB => ({
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    });

    const baseColor = hexToRgb(baseColorHex);

    this.backgroundColors = [];
    this.foregroundColors = [];

    backgroundGroups.forEach((group: string) => {
      if (groupedVariables[group]) {
        this.backgroundColors.push(...groupedVariables[group]);
      }
    });

    foregroundGroups.forEach((group: string) => {
      if (groupedVariables[group]) {
        this.foregroundColors.push(...groupedVariables[group]);
      }
    });

    const backgroundLabel = backgroundGroups.length
      ? backgroundGroups.join(", ")
      : "background";
    const foregroundLabel = foregroundGroups.length
      ? foregroundGroups.join(", ")
      : "text";
    const matrixLabel = array.useDistinct
      ? `${backgroundLabel} × ${foregroundLabel}`
      : backgroundLabel;

    const gridHeaderTileComponent = await figma.importComponentByKeyAsync(
      "d4136c7cdbfa21a9bc90421b055b2bd6f2260a54",
    );
    const gridAxisTileComponent = await figma.importComponentByKeyAsync(
      "13d3d4c5a355847f9f56eaf96541e6fa8a29311d",
    );
    const specHeaderTemplate = await figma.importComponentByKeyAsync(
      "e0b50d04f34885e7b7dc13680776a1a62c307006",
    );
    const gridTileComponent = await figma.importComponentByKeyAsync(
      "f9ab15001530fa4cc6360b7f1742dc71f16a7add",
    );
    // const gridTileComponent = figma.currentPage.findOne(node => node.name === 'gridTile');
    // const gridHeaderTileComponent = figma.currentPage.findOne(node => node.name === 'gridHeaderTile');
    // const gridAxisTileComponent = figma.currentPage.findOne(node => node.name === 'gridAxisTile');
    // const specHeaderTemplate = figma.currentPage.findOne(node => node.name === 'specHeader');
    const matrixFrame = this.createFrame(
      "VERTICAL",
      matrixLabel.toLowerCase(),
      0,
      0,
      0,
      baseColor,
    );
    const colorFrame = this.createFrame(
      "VERTICAL",
      "colors",
      1,
      1,
      1,
      baseColor,
    );

    if (specHeaderTemplate) {
      const specHeaderCopy = specHeaderTemplate.createInstance();
      specHeaderCopy.layoutAlign = "STRETCH";

      //const specHeaderCopy = specHeaderTemplate.clone() as InstanceNode;
      const headerLabel = specHeaderCopy.findOne(
        (node) => node.name === "title",
      );

      if (headerLabel && headerLabel.type === "TEXT") {
        headerLabel.characters = matrixLabel.toLowerCase();
      }
      matrixFrame.appendChild(specHeaderCopy);
    }
    matrixFrame.appendChild(colorFrame);

    if (gridTileComponent && gridTileComponent.type === "COMPONENT") {
      const componentNode = gridTileComponent as ComponentNode;
      const componentHeaderNode = gridHeaderTileComponent as ComponentNode;
      const componentAxisNode = gridAxisTileComponent as ComponentNode;
      const rowFrames: FrameNode[] = [];

      if (
        gridHeaderTileComponent &&
        gridHeaderTileComponent.type === "COMPONENT"
      ) {
        const axisTileInstance =
          componentAxisNode.createInstance() as InstanceNode;
        const headerFrame = this.createFrame(
          "HORIZONTAL",
          "header",
          1,
          0,
          0,
          baseColor,
        );
        rowFrames.push(headerFrame);
        headerFrame.appendChild(axisTileInstance);

        for (let col = 0; col < this.foregroundColors.length; col++) {
          const headerTileInstance =
            componentHeaderNode.createInstance() as InstanceNode;
          const columnColor = this.foregroundColors[col];
          const headerTile = new Tile(
            headerTileInstance,
            columnColor,
            columnColor,
            baseColor,
          );
          headerTile.applyColors(array.fullName);
          headerFrame.appendChild(headerTileInstance);
        }
        colorFrame.appendChild(headerFrame);
      }

      for (let row = 0; row < this.backgroundColors.length; row++) {
        const rowFrame = this.createFrame(
          "HORIZONTAL",
          "row",
          1,
          0,
          0,
          baseColor,
        );
        rowFrames.push(rowFrame);

        const headerRowTileInstance =
          componentHeaderNode.createInstance() as InstanceNode;
        const rowColor = this.backgroundColors[row];
        const headerRowTile = new Tile(
          headerRowTileInstance,
          rowColor,
          rowColor,
          baseColor,
        );
        headerRowTile.applyColors(array.fullName);
        rowFrame.appendChild(headerRowTileInstance);

        for (let col = 0; col < this.foregroundColors.length; col++) {
          const tileInstance = componentNode.createInstance() as InstanceNode;
          const tile = new Tile(
            tileInstance,
            this.backgroundColors[row],
            this.foregroundColors[col],
            baseColor,
          );
          tile.applyColors(array.fullName);
          tile.processTile(array);
          rowFrame.appendChild(tileInstance);
        }
        colorFrame.appendChild(rowFrame);
      }
      const nodes = [];

      figma.currentPage.appendChild(matrixFrame);
      nodes.push(matrixFrame);
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);

      figma.closePlugin("Matrix generated successfully!");
    } else {
      figma.closePlugin(
        "Template components not found or not a valid component!",
      );
    }
  }
}

// Initialize matrix generator and UI handling
const generator = new ColorMatrixGenerator();

// Fetch variables and send them to the UI
generator.getColorVariables().then((variables) => {
  const groups = generator.groupVariablesByPrefix(variables);
  figma.ui.postMessage({ groups });
});

// Handle UI messages
figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-grid") {
    const backgrounds = msg.array.selectedBackgroundGroups ?? [];
    const foregrounds = msg.array.useDistinct
      ? (msg.array.selectedForegroundGroups ?? [])
      : backgrounds;

    await generator.generateMatrix(
      backgrounds,
      foregrounds,
      msg.array,
      msg.baseColorHex,
    );
  } else if (msg.type === "close") {
    figma.closePlugin();
  }
};
