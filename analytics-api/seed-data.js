import axios from 'axios';

// URL de ingestion (cambia según tu entorno Druid)
const DRUID_INGEST_URL = 'http://localhost:8888/druid/v2/sql/task';

// Función que genera un evento aleatorio
function generateEvent(i) {
  const users = ['U001', 'U002', 'U003', 'U004'];
  const courses = ['C001', 'C002', 'C003'];
  const exercises = ['E001', 'E002', 'E003', 'E004'];
  const devices = ['mobile', 'tablet', 'desktop'];
  const countries = ['Argentina', 'Uruguay', 'Chile', 'Paraguay'];
  const eventTypes = ['attempt', 'error'];
  const errorTypes = [null, 'timeout', 'wrong_answer', 'grammar'];

  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const errorType =
    eventType === 'error'
      ? errorTypes[Math.floor(Math.random() * errorTypes.length)]
      : null;

  return {
    event_id: `EVT${2000 + i}`,
    timestamp: new Date(Date.now() - Math.random() * 1e9).toISOString(),
    user_id: users[Math.floor(Math.random() * users.length)],
    course_id: courses[Math.floor(Math.random() * courses.length)],
    exercise_id: exercises[Math.floor(Math.random() * exercises.length)],
    event_type: eventType,
    duration_seconds: Math.floor(Math.random() * 60),
    score: eventType === 'attempt' ? Math.floor(Math.random() * 100) : 0,
    error_type: errorType,
    device: devices[Math.floor(Math.random() * devices.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    is_deleted: false,
  };
}

// Generar 100 eventos
const events = Array.from({ length: 200 }, (_, i) => generateEvent(i));

// Enviar a Druid a través de tu API Nest (más recomendable)
const sendToApi = async () => {
  try {
    const res = await axios.post('http://localhost:3000/events', events);
    console.log(`✅ ${events.length} eventos insertados correctamente`);
  } catch (err) {
    console.error('❌ Error insertando eventos:', err.message);
  }
};

sendToApi();
