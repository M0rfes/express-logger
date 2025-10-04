import express from 'express'
import { AsyncLocalStorage } from 'node:async_hooks'
import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'

type Context = {
  logger: winston.Logger
}

const asyncLocalStorage = new AsyncLocalStorage<Map<keyof Context, Context[keyof Context]>>()

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
})

// Middleware to store logger with unique request id in context
function loggerMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const reqId = req.header('x-uuid') || uuidv4()
  const reqLogger = logger.child({ reqId }) // Attach x-uuid to logger
  asyncLocalStorage.run(new Map([['logger', reqLogger]]), () => next())
}

function getLogger() {
  return asyncLocalStorage.getStore()?.get('logger') || logger
}


const app = express();

app.use(loggerMiddleware);

app.get('/', async (req: express.Request, res: express.Response) => {
  getLogger().info('Request received', { action: 'start' });
  await controller();
  // ... any async work here ...
  res.send('hello world');
});

app.listen(3000, () => {
  logger.info('Server is running on port 3000');
});


// No need to pass req to access.
// the context can be accessed from the asyncLocalStorage
const controller = async () => {
  getLogger().info('in controller', { action: 'start' });
}