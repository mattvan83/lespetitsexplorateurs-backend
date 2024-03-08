const invertMappingTable = (originalMappingTable) => {
  const invertMappedTable = {};

  for (const key in originalMappingTable) {
    if (originalMappingTable.hasOwnProperty(key)) {
      const originalValue = originalMappingTable[key];
      invertMappedTable[originalValue] = key;
    }
  }

  return invertMappedTable;
};

module.exports = { invertMappingTable };
