// Plain-English areas of the car for the Project Planner, built from
// Golden Star's category paths (e.g. "/tri-five/Body-Components/Floor").

export const AREAS = [
  { id: 'floors-trunk', name: 'Floors and trunk', hint: 'Floor pans, trunk floors, braces, tail panels', cats: ['Floor', 'Trunk-Floor', 'Deck-Filler-Panels', 'Tail-Panels'], words: /floor|trunk|tail pan|tail panel|spare tire|deck filler/ },
  { id: 'quarters-rockers', name: 'Quarter panels and rockers', hint: 'Quarters, rockers, wheelhouses, inner quarters', cats: ['Quarter-Panels', 'Rocker-Panels', 'Wheelhouse'], words: /quarter|rocker|wheelhouse|wheel house/ },
  { id: 'front-end', name: 'Front end', hint: 'Fenders, hoods, cowl, firewall, radiator supports', cats: ['Fenders', 'Hoods', 'Front-End-Kits', 'Cowl-Panels-Components', 'Firewalls', 'Core-Supports', 'Inner-Fenders', 'Battery-Trays'], words: /fender|hood|cowl|firewall|radiator|front end|battery/ },
  { id: 'doors-roof', name: 'Doors, roof and pillars', hint: 'Door shells and skins, roof, convertible top, tailgates, trunk lids', cats: ['Doors', 'Roof-Panels', 'Convertible-Top', 'Tailgates', 'Trunk-Lids'], words: /door|roof|pillar|tailgate|trunk lid|convertible top|body shell/ },
  { id: 'bumpers-grille', name: 'Bumpers and grille', hint: 'Bumpers, guards, brackets, grilles', cats: ['Bumpers', 'Bumper-Brackets', 'Grilles'], words: /bumper|grille|grill/ },
  { id: 'glass-windows', name: 'Glass, windows and seals', hint: 'Vent windows, regulators, glass runners, weatherstrip', cats: ['Door-Glass', 'Mirrors', 'Quarter-Vent-Glass-Related', 'Vent-Window-Related', 'Window-Regulators', 'Wiper-Arms', 'Weatherstrip-Related'], words: /glass|window|vent|regulator|weather ?strip|mirror|wiper/ },
  { id: 'trim-emblems', name: 'Chrome trim and emblems', hint: 'Moldings, scripts, hood and trunk V’s', cats: ['Exterior-Moldings', 'Interior-Moldings', 'Fender-Emblems', 'Scripts-&-Hood-and-Trunk-Vees'], words: /molding|moulding|script|emblem|louver|trim|bezel/ },
  { id: 'lights', name: 'Lights', hint: 'Headlight buckets, tail lights, parking lights', cats: ['Light-Related', 'Parking-Lamps'], words: /light|lamp/ },
  { id: 'interior', name: 'Interior', hint: 'Seats, dash, door handles, sill plates, heater', cats: ['Dash-Panels', 'Door-Handles-Crank-Handles', 'Door-Sill-Plates', 'Seat-Related', 'Vent-Grilles', 'Air-Vents', 'Heater-Boxes'], words: /seat|dash|handle|sill|heater|arm ?rest/ },
  { id: 'fuel-chassis', name: 'Gas tank, frame and brakes', hint: 'Gas tanks, sending units, frames, control arms, body mounts', cats: ['Gas-Tank-Filler-Necks', 'Gas-Tank-Sending-Units', 'Gas-Tank-Straps', 'Gas-Tanks', 'Chassis-Frame', 'Control-Arms', 'Brake-Related', 'Body-Mounts'], words: /fuel|gas tank|sending unit|frame|control arm|brake|body mount/ },
] as const;

export type AreaId = (typeof AREAS)[number]['id'];

export function areasFor(categoryPaths: string[], title: string): AreaId[] {
  const leaves = categoryPaths.map((c) => c.split('/').pop() || '');
  const found = new Set<AreaId>();
  for (const a of AREAS) if (leaves.some((l) => (a.cats as readonly string[]).includes(l))) found.add(a.id);
  if (!found.size) {
    // parts Golden Star never put in a category: fall back to the title
    const t = title.toLowerCase();
    for (const a of AREAS) if (a.words.test(t)) { found.add(a.id); break; }
  }
  return [...found];
}

export const areaName = (id: string) => AREAS.find((a) => a.id === id)?.name ?? '';
