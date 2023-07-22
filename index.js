// Every main bubble needs a letter
const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "W",
  "X",
  "Y",
  "Z",
];

/** Choose the size of certain areas yourself to tune your graph
 * The key (at the left of the :) is always the overlapping areas / the headers of your columns joined together with a |
 * The value is the relative size.
 *
 * Putting values here might need a little practice.
 * Basically, if you notice a certain area should be a bit bigger or smaller, put a new value here
 *
 * In sizeByAmountOfOverlaps, you will find the default values per overlap
 * In this case: A AB B
 * A = 100
 * B = 100
 * AB = 70
 */
const sizeBySpecificSnpMarketArea = {
  [`CT_S2C00019822_60|L_S2C00020400_4|L_S2C00020365_25|V_S2C00018101_56|V_S2C00022316_19`]: 1,
  ["CT_S2C00019822_60"]: 200,
  ["V_S2C00014306_20"]: 125,
  ["L_S2C00020365_25"]: 80,
  ["CT_S2C00019822_60|V_S2C00014306_20"]: 100,
};

/**
 * In sizeByAmountOfOverlaps, you will find the default values per overlap
 * In this case: A AB B
 * A = 100
 * B = 100
 * AB = 70
 */
const sizeBySnpMarketSize = {
  1: 100,
  2: 70,
  3: 50,
  4: 30,
  5: 20,
  6: 5,
};

/** Global variable to save all the data in
 * Array<{header: string; items: Array<string>}>
 */
var sets = [];

/**
 * To be able to see all the areas, all the areas with one lesser overlap must already exist
 *
 * Take the following example:
 *
 * 4 Headers: A B C D
 * The area: A|B|C|D
 *
 * Before we create this area, we need to create the following areas first:
 * A|B|C
 * A|B|D
 * A|C|D
 *
 * The following function retuns all the possible combinations when given an array of the specific headers
 */
function getAllCombinations(strings) {
  if (strings.length < 3) {
    return strings;
  }

  const stringLength = strings.length;
  const combinationLength = stringLength - 1;

  const loopStartStrings = strings.slice(
    0,
    stringLength - combinationLength + 1
  );
  const combinations = [];

  for (
    let stringIndex = 0;
    stringIndex < loopStartStrings.length;
    stringIndex++
  ) {
    const string = loopStartStrings[stringIndex]; // A

    const otherStrings = strings.slice(stringIndex + 1, stringLength); // ["B", "C", "D"]

    if (stringIndex === loopStartStrings.length - 1) {
      combinations.push([string, ...otherStrings]);
    } else {
      const deeperCombo = getAllCombinations(otherStrings);
      const combo = deeperCombo.map((s) => [
        string,
        ...(Array.isArray(s) ? s : [s]),
      ]);

      combinations.push(...combo);
    }
  }

  return combinations;
}

/**
 * This function will read the data out the chosen csv file
 * It loops over all the characters to create respective arrays of each set / column
 */
function generateGraph() {
  // Create a file reader object.
  const reader = new FileReader();

  // When the file is loaded, call the callback function.
  reader.onload = (event) => {
    // Get the file data as a string.
    const data = event.target.result;

    // Split the data by line break.
    const lines = data.split("\n");

    // Create an array to store the data.
    const headers = lines[0].split("\r")[0].split(";");
    const itemrows = lines.slice(1);

    // Array<{name: string; items: Array<string>}>
    sets = [];

    for (let rowIndew = 0; rowIndew < itemrows.length; rowIndew++) {
      const row = itemrows[rowIndew];
      const items = row.split("\r")[0].split(";");

      if (rowIndew === 0) {
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          sets.push({ name: headers[itemIndex], items: [] });
        }
        continue;
      }

      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        if (!!items[itemIndex]) {
          sets[itemIndex].items.push(items[itemIndex]);
        }
      }
    }

    drawVennDiagram(sets);
  };

  // Read the file.
  reader.readAsText(document.querySelector("input").files[0]);
}

function drawVennDiagram() {
  // header of each column
  const snpMarkers = sets.map((s) => s.name);

  /**
   * {
   *   header: "A-Z"
   * }
   */
  const letterBySnpMarker = snpMarkers.reduce((acc, curr, index) => {
    acc[curr] = alphabet[index];
    return acc;
  }, {});

  /**
   * {
   *   header: color
   * }
   */
  const colorBySnpMarker = snpMarkers.reduce((acc, curr) => {
    acc[curr] = "#4795BA 0.25";
    return acc;
  }, {});

  /**
   * We want to know all the overlaps (header) for one single item
   * Record<item, Array<header>> */
  const snpMarkersByStrain = {};

  for (let setIndex = 0; setIndex < sets.length; setIndex++) {
    const set = sets[setIndex];
    const setName = set.name;
    const setItems = set.items;

    for (let itemIndex = 0; itemIndex < setItems.length; itemIndex++) {
      const strain = setItems[itemIndex];

      const snpMarkers = snpMarkersByStrain[strain];

      if (snpMarkers === undefined) {
        snpMarkersByStrain[strain] = [setName];
      } else {
        snpMarkersByStrain[strain].push(setName);
      }
    }
  }

  /**
   * We want to know all the items for one single overlap (area)
   * Record<Area, Array<item>> */
  const strainsBySnpMarkerArea = {};
  const snpMarkersByStrainEntries = Object.entries(snpMarkersByStrain);

  for (
    let strainIndex = 0;
    strainIndex < snpMarkersByStrainEntries.length;
    strainIndex++
  ) {
    const [strain, snpMarkers] = snpMarkersByStrainEntries[strainIndex];
    const conjunctedSnpMarker = snpMarkers.join("|");
    const strains = strainsBySnpMarkerArea[conjunctedSnpMarker];

    if (strains === undefined) {
      strainsBySnpMarkerArea[conjunctedSnpMarker] = [strain];
    } else {
      strainsBySnpMarkerArea[conjunctedSnpMarker].push(strain);
    }
  }

  const strainsBySnpMarkerAreaEntries = Object.entries(
    strainsBySnpMarkerArea
  ).sort((a, b) => {
    const lengthA = a[0].length;
    const lengthB = b[0].length;

    if (lengthA === lengthB) {
      return a[0] - b[0];
    } else {
      return lengthA - lengthB;
    }
  });

  /** We want to bundle all of this information together to 1 big object
   * that contains the header name, all the items, all the different areas...
   */
  const data = [];

  for (
    let SnpMarkerAreaIndex = 0;
    SnpMarkerAreaIndex < strainsBySnpMarkerAreaEntries.length;
    SnpMarkerAreaIndex++
  ) {
    const [snpMarkerArea, strains] =
      strainsBySnpMarkerAreaEntries[SnpMarkerAreaIndex];
    const snpMarkers = snpMarkerArea.split("|");
    const snpMarkersLength = snpMarkers.length;

    const text =
      snpMarkers.length === 1
        ? `${snpMarkerArea}\n${strains.join("\n")}`
        : strains.join("\n");
    const value =
      sizeBySpecificSnpMarketArea[snpMarkerArea] ||
      sizeBySnpMarketSize[snpMarkers.length] ||
      0;

    if (snpMarkersLength === 2) {
      /** We need to check of the lower connection exists */

      for (
        let snpMarkerIndex = 0;
        snpMarkerIndex < snpMarkers.length;
        snpMarkerIndex++
      ) {
        const snpMarker = snpMarkers[snpMarkerIndex];
        const item = data.find((d) => d.area === snpMarker);

        if (item === undefined) {
          const value =
            sizeBySpecificSnpMarketArea[snpMarker] ||
            sizeBySnpMarketSize[1] ||
            0;

          data.push({
            x: [letterBySnpMarker[snpMarker]],
            area: snpMarker,
            name: snpMarker,
            value,
          });
        }
      }
    }

    if (snpMarkersLength > 2) {
      /** We need to check of the lower connection exists
          Create every combination possible and check all of them
          If not, create it
        */

      const combinations = getAllCombinations(snpMarkers);
      const areas = combinations.map((c) => c.join("|"));

      for (let areaIndex = 0; areaIndex < areas.length; areaIndex++) {
        const area = areas[areaIndex];
        const item = data.find((d) => d.area === area);

        if (item === undefined) {
          const snpMarkers = area.split("|");
          const value =
            sizeBySpecificSnpMarketArea[area] ||
            sizeBySnpMarketSize[snpMarkers.length] ||
            0;

          data.push({
            x: snpMarkers.map((snpMarker) => letterBySnpMarker[snpMarker]),
            area: area,
            name: "",
            value,
          });
        }
      }
    }

    data.push({
      x: snpMarkers.map((snpMarker) => letterBySnpMarker[snpMarker]),
      area: snpMarkerArea,
      name: text,
      value,
    });
  }

  for (let index = 0; index < data.length; index++) {
    const datum = data[index];

    if (datum.x.length === 1) {
      datum.normal = { fill: colorBySnpMarker[datum.area] };
    }
  }

  // creating a venn diagram with the data
  let chart = anychart.venn(data);

  // setting the labels
  chart
    .labels()
    .fontSize(13)
    .fontColor("#000")
    .hAlign("center")
    .vAlign("center")
    .fontWeight("500")
    .format("{%Name}");

  // setting the intersection labels
  chart
    .intersections()
    .labels()
    .fontSize(9)
    .fontColor("#000")
    .format("{%Name}");

  // disabling the legend
  chart.legend(false);

  // improving the tooltip
  chart.tooltip().format("");
  chart.tooltip().separator(false);

  // setting the container id
  chart.container("graph");

  // drawing the diagram
  chart.draw();
}
