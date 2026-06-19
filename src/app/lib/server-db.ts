import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: false,
    })
  : null;

export async function isDbConnected(): Promise<boolean> {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch {
    return false;
  }
}

export async function initDb() {
  if (!pool) {
    console.log("No DATABASE_URL set — using localStorage fallback mode");
    return;
  }

  try {
    const client = await pool.connect();

    // Trainings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        price INTEGER NOT NULL DEFAULT 0,
        duration VARCHAR(100),
        level VARCHAR(50),
        content JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Questions pool table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
        paid BOOLEAN DEFAULT FALSE,
        payment_reference VARCHAR(255),
        progress INTEGER DEFAULT 0,
        exam_attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        passed BOOLEAN DEFAULT FALSE,
        score INTEGER DEFAULT 0,
        certificate_url VARCHAR(500),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(driver_id, training_id)
      )
    `);

    // Sessions table (same as Bright Elite)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log("Bright Academy database tables initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export function dbRowToDriver(row: any) {
  return {
    id: row.id?.toString(),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    nationalId: row.national_id,
    dateOfBirth: row.date_of_birth,
    location: row.location,
    licenseNumber: row.license_number,
    licenseCategory: row.license_category,
    licenseExpiry: row.license_expiry,
    yearsExperience: row.years_experience,
    vehicleTypes: row.vehicle_types || [],
    accidentHistory: row.accident_history,
    accidentDetails: row.accident_details,
    hasDefensiveDriving: row.has_defensive_driving,
    hasFirstAid: row.has_first_aid,
    languages: row.languages || [],
    employmentStatus: row.employment_status,
    desiredTraining: row.desired_training || [],
    classification: row.classification,
    recommendedTrainings: row.recommended_trainings || [],
    nextSteps: row.next_steps || [],
    createdAt: row.created_at,
  };
}

export function dbRowToTraining(row: any) {
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    description: row.description,
    price: row.price,
    duration: row.duration,
    level: row.level,
    content: row.content || [],
    status: row.status,
    createdAt: row.created_at,
  };
}

export function dbRowToQuestion(row: any) {
  return {
    id: row.id,
    trainingId: row.training_id,
    question: row.question,
    options: row.options || [],
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    createdAt: row.created_at,
  };
}

export function dbRowToEnrollment(row: any) {
  return {
    id: row.id,
    driverId: row.driver_id,
    trainingId: row.training_id,
    paid: row.paid,
    paymentReference: row.payment_reference,
    progress: row.progress,
    examAttempts: row.exam_attempts,
    maxAttempts: row.max_attempts,
    passed: row.passed,
    score: row.score,
    certificateUrl: row.certificate_url,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
