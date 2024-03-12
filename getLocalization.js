const fetch = require("node-fetch");
const fs = require("fs");

const citiesNearHauterives = [
  {
    city: "Romans-sur-Isère",
  },
  {
    city: "Tain-l'Hermitage",
  },
  {
    city: "Valence",
  },
  {
    city: "Bourg-de-Péage",
  },
  {
    city: "Saint-Péray",
  },
  {
    city: "Saint-Marcellin",
  },
  { city: "Vienne" },
  {
    city: "Annonay",
  },
  {
    city: "Châteauneuf-sur-Isère",
  },
  {
    city: "Loriol-sur-Drôme",
  },
  {
    city: "Montélimar",
  },
  { city: "Crest" },
  {
    city: "Livron-sur-Drôme",
  },
  { city: "Die" },
  {
    city: "Donzère",
  },
  {
    city: "Saint-Rambert-d'Albon",
  },
  { city: "Nyons" },
  {
    city: "Saint-Vallier",
  },
  {
    city: "Pierrelatte",
  },
  {
    city: "Le Teil",
  },
];

const main = async () => {
  const locationsNearHauterives = await (async () => {
    const locationsNearHauterives = [];

    for (let i = 0; i < citiesNearHauterives.length; i++) {
      await fetch(
        `https://geo.api.gouv.fr/communes?nom=${citiesNearHauterives[i].city}&fields=code,nom,departement,region,centre&limit=8`
      )
        .then((response) => response.json())
        .then((apiData) => {
          console.log("index: ", i);

          let foundLocation = apiData.find(
            (location) => location.region.nom === "Auvergne-Rhône-Alpes"
          );

          foundLocation = {
            id: i,
            cityName: foundLocation.nom,
            postalCode: foundLocation.code,
            department: foundLocation.departement.nom,
            region: foundLocation.region.nom,
            coords: foundLocation.centre.coordinates,
          };

          locationsNearHauterives.push(foundLocation);
        });
    }

    return locationsNearHauterives;
  })();

  // Write to JSON files
  fs.writeFileSync(
    "./test/sampleCities.json",
    JSON.stringify(locationsNearHauterives, null, 2)
  );

  console.log("Sample JSON data generated successfully.");
};

main();
