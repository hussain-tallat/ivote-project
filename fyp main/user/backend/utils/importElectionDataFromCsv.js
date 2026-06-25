const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const Election = require('../models/Election');
const Party = require('../models/Party');
const Candidate = require('../models/Candidate');

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-');

const parseCsvLine = (line) => {
  // Basic CSV parser supporting quoted values with commas.
  // Assumes UTF-8 and \n line endings.
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }
  result.push(current);
  return result.map((v) => v.trim());
};

const stableNumericString = (input, length) => {
  const hash = crypto.createHash('sha256').update(String(input)).digest('hex');
  // Convert hex -> digits by taking char codes and mod 10.
  let digits = '';
  for (let i = 0; i < hash.length && digits.length < length; i++) {
    const n = parseInt(hash[i], 16);
    digits += String(n % 10);
  }
  // Ensure fixed length; pad with zeros if needed.
  while (digits.length < length) digits += '0';
  return digits.slice(0, length);
};

const makeCnic = (rowKey) => {
  // CNIC requires 13 digits.
  return stableNumericString(rowKey, 13);
};

const makeEmail = (rowKey) => {
  return `candidate-${stableNumericString(rowKey, 8)}@ivotepk.com`;
};

const makePhone = () => '+923000000000';

const pickElectionType = ({ naCol, constituencyCol }) => {
  // If NA column looks like "NA-1" => National; else Provincial.
  const s = `${naCol || ''}`.toUpperCase();
  if (s.startsWith('NA-')) return 'National';
  const c = `${constituencyCol || ''}`.toUpperCase();
  if (c.includes('NA-')) return 'National';
  return 'Provincial';
};

async function importElectionDataFromCsv({
  csvPath,
  limitRows = 5000,
  force = false,
  createdByUserId,
  status = 'active'
}) {
  const absolutePath = csvPath
    ? path.resolve(csvPath)
    : path.resolve('cleaned_dataset_final.csv');

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  if (!force) {
    const electionCount = await Election.countDocuments();
    if (electionCount > 0) {
      console.log('Elections already exist. Skipping CSV import (set CSV_FORCE=true to override).');
      return;
    }
  }

  console.log(`Importing election data from CSV: ${absolutePath}`);

  const raw = fs.readFileSync(absolutePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV does not contain enough rows.');

  const header = parseCsvLine(lines[0]);
  const colIndex = {};
  header.forEach((name, idx) => {
    colIndex[name] = idx;
  });

  const requiredCols = ['Year', 'Constituency', 'NA', 'Party', 'Candidate Name', 'Turnout N', 'Votes'];
  for (const c of requiredCols) {
    if (colIndex[c] === undefined) {
      throw new Error(`CSV missing required column: ${c}`);
    }
  }

  const partyCache = new Map(); // partyName -> Party doc
  const candidateCache = new Map(); // candidateKey -> candidate fields
  const electionAgg = new Map(); // electionKey -> {turnout, resultsMap, partiesSet, candidatesSet}

  const parseNumber = (v) => {
    const n = parseFloat(String(v || '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  let processed = 0;
  for (let i = 1; i < lines.length; i++) {
    if (processed >= limitRows) break;
    const row = parseCsvLine(lines[i]);
    processed++;

    const year = String(row[colIndex['Year']] || '').trim();
    const constituency = String(row[colIndex['Constituency']] || '').trim();
    const naCol = String(row[colIndex['NA']] || '').trim();
    const partyName = String(row[colIndex['Party']] || '').trim();
    const candidateName = String(row[colIndex['Candidate Name']] || '').trim();
    const turnoutN = parseNumber(row[colIndex['Turnout N']]);
    const votes = parseNumber(row[colIndex['Votes']]);

    if (!year || !constituency || !partyName || !candidateName) continue;
    if (!votes && votes !== 0) continue;

    // Normalize keys
    const electionKey = `${year}|${naCol || constituency}`;
    const candidateKey = `${electionKey}|${partyName}|${candidateName}`;

    // Ensure party baseline data
    if (!partyCache.has(partyName)) {
      // shortName/symbol are required by schema.
      const shortName = String(partyName)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 8);

      partyCache.set(partyName, {
        name: partyName,
        shortName: shortName || 'PARTY',
        symbol: shortName ? `${shortName}` : 'SYM',
        isActive: true,
        createdBy: createdByUserId
      });
    }

    if (!electionAgg.has(electionKey)) {
      electionAgg.set(electionKey, {
        year,
        naOrConstituency: naCol || constituency,
        constituency: naCol || constituency,
        naCol,
        totalVotes: 0,
        turnoutN: turnoutN || 0,
        resultsMap: new Map(), // candidateName -> {partyName, votes}
        partiesSet: new Set(),
        candidatesSet: new Set()
      });
    }

    const agg = electionAgg.get(electionKey);
    agg.totalVotes += votes;
    if (turnoutN > 0) agg.turnoutN = turnoutN;
    agg.partiesSet.add(partyName);
    agg.candidatesSet.add(candidateName);
    agg.resultsMap.set(candidateKey, { partyName, candidateName, votes });

    if (!candidateCache.has(candidateKey)) {
      const cnic = makeCnic(candidateKey);
      const email = makeEmail(candidateKey);
      candidateCache.set(candidateKey, {
        name: candidateName,
        cnic,
        email,
        phone: makePhone(),
        partyName,
        constituency: naCol || constituency,
        age: 35,
        gender: 'Other',
        status: 'active',
        isActive: true,
        biography: undefined,
        education: undefined,
        achievements: [],
        promises: [],
        createdBy: createdByUserId
      });
    }
  }

  console.log(`CSV rows processed: ${processed}`);
  console.log(`Unique elections found: ${electionAgg.size}`);
  console.log(`Unique parties: ${partyCache.size}`);
  console.log(`Unique candidates: ${candidateCache.size}`);

  // Upsert parties
  const partiesToInsert = Array.from(partyCache.values());
  const insertedParties = await Promise.all(
    partiesToInsert.map((p) => Party.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true }))
  );
  const partyIdByName = new Map(insertedParties.map((p) => [p.name, p._id]));

  // Insert candidates
  const candidatesToInsert = Array.from(candidateCache.entries()).map(([candidateKey, c]) => {
    const partyId = partyIdByName.get(c.partyName);
    return {
      candidateKey,
      ...c,
      party: partyId,
      partySymbol: partyCache.get(c.partyName)?.shortName || c.partyName
    };
  });

  // Avoid duplicate candidate insertions: use cnic as a stable unique.
  const insertedCandidates = await Promise.all(
    candidatesToInsert.map((c) => {
      const { candidateKey, ...payload } = c;
      return Candidate.findOneAndUpdate({ cnic: payload.cnic }, payload, { upsert: true, new: true });
    })
  );
  const candidateIdByKey = new Map();
  insertedCandidates.forEach((doc, idx) => {
    candidateIdByKey.set(candidatesToInsert[idx].candidateKey, doc._id);
  });

  // Insert elections + results
  const now = new Date();
  const startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const electionsToInsert = [];
  for (const [electionKey, agg] of electionAgg.entries()) {
    const type = pickElectionType({ naCol: agg.naCol, constituencyCol: agg.constituency });

    const totalVotes = agg.totalVotes || 0;
    const eligibleVoters = agg.turnoutN || totalVotes || 1000;
    const turnoutPercentage = eligibleVoters ? (totalVotes / eligibleVoters) * 100 : 0;

    const results = [];

    for (const [candidateKey, r] of agg.resultsMap.entries()) {
      const candidateId = candidateIdByKey.get(candidateKey);
      const partyId = partyIdByName.get(r.partyName);
      if (!candidateId || !partyId) continue;
      results.push({
        candidateId,
        partyId,
        votes: r.votes,
        percentage: eligibleVoters ? (r.votes / eligibleVoters) * 100 : 0
      });
    }

    // Build candidate IDs + party IDs arrays for Election schema
    const candidateIds = Array.from(new Set(results.map((r) => r.candidateId.toString()))).map((id) => results.find((r) => r.candidateId.toString() === id)?.candidateId);
    const partyIds = Array.from(new Set(results.map((r) => r.partyId.toString()))).map((id) => results.find((r) => r.partyId.toString() === id)?.partyId);

    electionsToInsert.push({
      title: `Election ${agg.year} - ${agg.naOrConstituency}`,
      description: `Imported election data for ${agg.naOrConstituency} (${agg.year})`,
      type,
      constituency: agg.naOrConstituency,
      startDate,
      endDate,
      status,
      candidates: candidateIds.filter(Boolean),
      parties: partyIds.filter(Boolean),
      totalVotes,
      eligibleVoters,
      turnoutPercentage,
      results
    });
  }

  // Insert elections (unique by title + constituency + startDate)
  for (const election of electionsToInsert) {
    const existing = await Election.findOne({ title: election.title, constituency: election.constituency });
    if (existing) continue;
    election.createdBy = createdByUserId;
    await Election.create(election);
  }

  console.log(`CSV import complete.`);
}

module.exports = {
  importElectionDataFromCsv
};

