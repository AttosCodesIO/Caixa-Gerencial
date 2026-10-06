import oracledb, { Pool } from 'oracledb';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

// Modo "Thin" (padrão, sem instalação) só entende verificadores de senha
// pós-12c. Se ORACLE_CLIENT_LIB_DIR estiver definido (uso local/dev, quando
// o Oracle alvo ainda usa verificador legado), ativa o modo "Thick" via
// Instant Client. Em produção essa variável não deve existir — a resolução
// definitiva é o DBA regerar a senha com verificador SHA-2/12c.
const libDir = process.env.ORACLE_CLIENT_LIB_DIR;
if (libDir) {
  try {
    oracledb.initOracleClient({ libDir });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('already been initialized')) {
      throw error;
    }
  }
}

let poolPromise: Promise<Pool> | null = null;

function getPool(): Promise<Pool> {
  if (!poolPromise) {
    poolPromise = oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: 0,
      poolMax: 4,
      poolIncrement: 1,
      poolTimeout: 60,
    });
  }
  return poolPromise;
}

export async function withOracleConnection<T>(
  run: (connection: oracledb.Connection) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const connection = await pool.getConnection();
  try {
    return await run(connection);
  } finally {
    await connection.close();
  }
}
