export const DB_HEALTH_CHECKER = Symbol('DB_HEALTH_CHECKER');

export interface DbHealthChecker {
  ping(): Promise<'up' | 'down'>;
}
