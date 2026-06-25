const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Party = require('../models/Party');
const SecurityQuestion = require('../models/SecurityQuestion');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedSecurityQuestions = async () => {
  try {
    const count = await SecurityQuestion.countDocuments();
    if (count > 0) {
      console.log('Security questions already exist. Skipping...');
      return;
    }

    const questions = SecurityQuestion.schema.statics.getDefaultQuestions();
    await SecurityQuestion.insertMany(questions);
    console.log('✅ Security questions seeded successfully');
  } catch (error) {
    console.error('Error seeding security questions:', error);
  }
};

const seedParties = async () => {
  try {
    const count = await Party.countDocuments();
    if (count > 0) {
      console.log('Parties already exist. Skipping...');
      return;
    }

    const parties = [
      {
        name: 'Pakistan Tehreek-e-Insaf',
        shortName: 'PTI',
        symbol: 'Bat',
        description: 'Pakistan Tehreek-e-Insaf is a political party in Pakistan focused on justice and anti-corruption.',
        leader: 'Imran Khan',
        color: '#00563B',
        registrationNumber: 'PTI-001',
        founded: new Date('1996-04-25'),
        headquarters: 'Islamabad'
      },
      {
        name: 'Pakistan Muslim League (Nawaz)',
        shortName: 'PML-N',
        symbol: 'Tiger',
        description: 'Pakistan Muslim League (Nawaz) is a center-right political party focused on economic development.',
        leader: 'Nawaz Sharif',
        color: '#006A4E',
        registrationNumber: 'PMLN-001',
        founded: new Date('1993-10-11'),
        headquarters: 'Lahore'
      },
      {
        name: 'Pakistan Peoples Party',
        shortName: 'PPP',
        symbol: 'Arrow',
        description: 'Pakistan Peoples Party is a center-left political party with socialist democratic ideology.',
        leader: 'Bilawal Bhutto Zardari',
        color: '#000000',
        registrationNumber: 'PPP-001',
        founded: new Date('1967-11-30'),
        headquarters: 'Karachi'
      },
      {
        name: 'Muttahida Qaumi Movement',
        shortName: 'MQM',
        symbol: 'Kite',
        description: 'Muttahida Qaumi Movement is a political party representing urban areas.',
        leader: 'Khalid Maqbool Siddiqui',
        color: '#FF0000',
        registrationNumber: 'MQM-001',
        founded: new Date('1984-03-18'),
        headquarters: 'Karachi'
      },
      {
        name: 'Jamaat-e-Islami Pakistan',
        shortName: 'JI',
        symbol: 'Scale',
        description: 'Jamaat-e-Islami Pakistan is an Islamic political party promoting religious values.',
        leader: 'Siraj-ul-Haq',
        color: '#008000',
        registrationNumber: 'JI-001',
        founded: new Date('1941-08-26'),
        headquarters: 'Lahore'
      },
      {
        name: 'Awami National Party',
        shortName: 'ANP',
        symbol: 'Lantern',
        description: 'Awami National Party is a Pashtun nationalist and secular political party.',
        leader: 'Asfandyar Wali Khan',
        color: '#DC143C',
        registrationNumber: 'ANP-001',
        founded: new Date('1986-07-09'),
        headquarters: 'Peshawar'
      },
      {
        name: 'Jamiat Ulema-e-Islam',
        shortName: 'JUI-F',
        symbol: 'Book',
        description: 'Jamiat Ulema-e-Islam is a Deobandi Islamic fundamentalist political party.',
        leader: 'Maulana Fazlur Rehman',
        color: '#8B4513',
        registrationNumber: 'JUIF-001',
        founded: new Date('1945-10-26'),
        headquarters: 'Islamabad'
      },
      {
        name: 'Pakistan Muslim League (Quaid)',
        shortName: 'PML-Q',
        symbol: 'Tractor',
        description: 'Pakistan Muslim League (Quaid) is a center-right political party.',
        leader: 'Chaudhry Shujaat Hussain',
        color: '#0000FF',
        registrationNumber: 'PMLQ-001',
        founded: new Date('2002-11-01'),
        headquarters: 'Islamabad'
      }
    ];

    await Party.insertMany(parties);
    console.log('✅ Parties seeded successfully');
    return parties;
  } catch (error) {
    console.error('Error seeding parties:', error);
  }
};

const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists. Skipping...');
      return adminExists;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123456', salt);

    const admin = await User.create({
      cnic: '1234567890123',
      email: 'admin@ivotepk.com',
      phone: '+923001234567',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      isVerified: true,
      biometricSetup: {
        faceRecognition: false,
        fingerprint: false
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('   Email: admin@ivotepk.com');
    console.log('   Password: admin123456');
    console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    return admin;
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

const seedTestVoters = async () => {
  try {
    const voterCount = await User.countDocuments({ role: 'voter' });
    if (voterCount > 0) {
      console.log('Test voters already exist. Skipping...');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('voter123', salt);

    const voters = [];
    for (let i = 1; i <= 5; i++) {
      voters.push({
        cnic: `2000000000${i.toString().padStart(3, '0')}`,
        email: `voter${i}@test.com`,
        phone: `+92300000000${i}`,
        password: hashedPassword,
        name: `Test Voter ${i}`,
        role: 'voter',
        isVerified: true,
        biometricSetup: {
          faceRecognition: false,
          fingerprint: false
        }
      });
    }

    await User.insertMany(voters);
    console.log('✅ Test voters created successfully');
    console.log('   Use: voter1@test.com to voter5@test.com');
    console.log('   Password: voter123');
  } catch (error) {
    console.error('Error seeding test voters:', error);
  }
};

const seedCandidates = async (parties) => {
  try {
    const count = await Candidate.countDocuments();
    if (count > 0) {
      console.log('Candidates already exist. Skipping...');
      return;
    }

    if (!parties || parties.length === 0) {
      parties = await Party.find();
    }

    const candidates = [];
    
    parties.forEach((party, index) => {
      for (let i = 1; i <= 3; i++) {
        candidates.push({
          name: `${party.shortName} Candidate ${i}`,
          cnic: `3000${index}0000${i.toString().padStart(3, '0')}`,
          email: `candidate${index}${i}@${party.shortName.toLowerCase()}.com`,
          phone: `+9230${index}000000${i}`,
          party: party._id,
          partySymbol: party.symbol,
          constituency: `NA-${245 + index}`,
          biography: `Experienced politician representing ${party.name}`,
          education: 'Masters in Political Science',
          age: 35 + i * 5,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          status: 'active',
          verificationStatus: 'verified',
          achievements: [`Achievement ${i}`, `Award ${i}`],
          promises: [`Promise ${i} for constituency`, `Development ${i}`]
        });
      }
    });

    await Candidate.insertMany(candidates);
    console.log('✅ Candidates seeded successfully');
    return candidates;
  } catch (error) {
    console.error('Error seeding candidates:', error);
  }
};

const seedElections = async (candidates, parties) => {
  try {
    const count = await Election.countDocuments();
    if (count > 0) {
      console.log('Elections already exist. Skipping...');
      return;
    }

    if (!candidates || candidates.length === 0) {
      candidates = await Candidate.find();
    }
    if (!parties || parties.length === 0) {
      parties = await Party.find();
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const elections = [
      {
        title: 'National Assembly Election 2026',
        description: 'General elections for National Assembly constituencies',
        type: 'National',
        constituency: 'NA-245',
        startDate: now,
        endDate: tomorrow,
        status: 'active',
        candidates: candidates.filter(c => c.constituency === 'NA-245').map(c => c._id),
        parties: parties.map(p => p._id),
        eligibleVoters: 50000,
        fraudDetectionEnabled: true
      },
      {
        title: 'Provincial Assembly Election - Sindh',
        description: 'Provincial Assembly elections for Sindh',
        type: 'Provincial',
        constituency: 'PS-111',
        startDate: tomorrow,
        endDate: nextWeek,
        status: 'upcoming',
        candidates: candidates.slice(0, 10).map(c => c._id),
        parties: parties.map(p => p._id),
        eligibleVoters: 30000,
        fraudDetectionEnabled: true
      }
    ];

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      elections.forEach(e => e.createdBy = admin._id);
    }

    await Election.insertMany(elections);
    console.log('✅ Elections seeded successfully');
  } catch (error) {
    console.error('Error seeding elections:', error);
  }
};

const seedDatabase = async () => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║         iVotePK Database Seeder                      ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  await connectDB();

  console.log('\n📊 Starting database seeding...\n');

  await seedSecurityQuestions();
  const admin = await seedAdminUser();
  await seedTestVoters();

  // Optional: import elections/parties/candidates.
  // Default is OFF so admin can add all parties/candidates/elections manually.
  const importCsv = String(process.env.IMPORT_ELECTIONS_CSV || 'false') === 'true';
  if (importCsv) {
    const { importElectionDataFromCsv } = require('./importElectionDataFromCsv');
    const csvPath =
      process.env.ELECTION_CSV_PATH ||
      'C:\\Users\\HS TRADER\\Downloads\\cleaned_dataset_final.csv';
    const limitRows = parseInt(process.env.ELECTION_CSV_LIMIT || '5000', 10);
    const force = String(process.env.CSV_FORCE || 'false') === 'true';

    await importElectionDataFromCsv({
      csvPath,
      limitRows: Number.isFinite(limitRows) ? limitRows : 5000,
      force,
      createdByUserId: admin?._id,
      status: 'active'
    });
  }

  console.log('\n✅ Database seeding completed successfully!\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║  Admin Login:                                         ║');
  console.log('║  Email: admin@ivotepk.com                            ║');
  console.log('║  Password: admin123456                               ║');
  console.log('║                                                       ║');
  console.log('║  Test Voters:                                         ║');
  console.log('║  Email: voter1@test.com to voter5@test.com          ║');
  console.log('║  Password: voter123                                  ║');
  console.log('║                                                       ║');
  console.log('║  ⚠️  Change passwords in production!                  ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  mongoose.connection.close();
  process.exit(0);
};

seedDatabase().catch(error => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
