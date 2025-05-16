import { EventEmitter } from "events";

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation, calls are allowed
  OPEN = "OPEN", // Circuit is open, calls are not allowed
  HALF_OPEN = "HALF_OPEN", // Testing if service is available again
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening the circuit
  resetTimeout: number; // Time in ms to wait before attempting to half-open
  fallbackFunction?: (err: Error, ...args: any[]) => Promise<any>; // Optional fallback function
  monitorFunction?: (state: CircuitState) => void; // Optional function to monitor state changes
}

/**
 * Circuit Breaker implementation for handling unreliable external service calls
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;
  private readonly options: CircuitBreakerOptions;
  private nextAttemptTime: number = 0;

  /**
   * Create a new CircuitBreaker
   * @param options CircuitBreaker configuration options
   */
  constructor(options: CircuitBreakerOptions) {
    super();
    // Apply defaults first, then override with provided options
    this.options = {
      // Default values
      ...{
        failureThreshold: 5,
        resetTimeout: 30000, // 30 seconds default
      },
      // User-provided options override defaults
      ...options,
    };

    // Set up monitoring if provided
    if (options.monitorFunction) {
      this.on("stateChange", options.monitorFunction);
    }
  }

  /**
   * Check if circuit is currently allowing calls
   */
  public get isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Get current circuit state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Wrap a function with circuit breaker protection
   * @param fn The function to protect
   * @returns A wrapped function with circuit breaker logic
   */
  public wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (this.state === CircuitState.OPEN) {
        // Check if it's time to try again
        if (Date.now() > this.nextAttemptTime) {
          this.transitionToState(CircuitState.HALF_OPEN);
        } else {
          const err = new Error("Circuit is open - service unavailable");

          // Use fallback if provided
          if (this.options.fallbackFunction) {
            return this.options.fallbackFunction(err, ...args);
          }

          throw err;
        }
      }

      try {
        const result = await fn(...args);

        // Success - reset if in half-open state
        if (this.state === CircuitState.HALF_OPEN) {
          this.reset();
        }

        return result;
      } catch (error) {
        // Handle error with circuit breaker logic
        // wait for the function to settle here to ensure the stack trace is clearer
        return await this.handleError(error, args);
      }
    }) as T;
  }

  /**
   * Handle an error that occurred during service call
   */
  private async handleError(error: any, args: any[]): Promise<any> | never {
    // Increment failure count
    this.failureCount++;

    // Log the failure
    console.warn(
      `Circuit Breaker: Failure #${this.failureCount}`,
      error.message || error,
    );

    // Should we open the circuit?
    if (
      (this.state === CircuitState.CLOSED &&
        this.failureCount >= this.options.failureThreshold) ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.transitionToState(CircuitState.OPEN);
      this.scheduleReset();
    }

    // Use fallback if provided
    if (this.options.fallbackFunction) {
      return this.options.fallbackFunction(error, ...args);
    }

    throw error;
  }

  /**
   * Reset circuit breaker to closed state
   */
  public reset(): void {
    this.failureCount = 0;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.transitionToState(CircuitState.CLOSED);
  }

  /**
   * Manually open the circuit
   */
  public forceOpen(): void {
    this.transitionToState(CircuitState.OPEN);
    this.scheduleReset();
  }

  /**
   * Change the circuit breaker's state
   */
  private transitionToState(newState: CircuitState): void {
    if (this.state !== newState) {
      const previousState = this.state;
      this.state = newState;

      console.info(
        `Circuit Breaker state change: ${previousState} -> ${newState}`,
      );
      this.emit("stateChange", newState, previousState);

      // Emit specific events for easier listening
      this.emit(newState.toLowerCase());
    }
  }

  /**
   * Schedule a reset after the configured timeout
   */
  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    // Set the time when we'll next attempt to call the service
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;

    this.resetTimer = setTimeout(() => {
      console.info(`Circuit Breaker: Resetting to HALF_OPEN after timeout`);
      this.transitionToState(CircuitState.HALF_OPEN);
    }, this.options.resetTimeout);
  }
}

// Create a registry to manage multiple circuit breakers by name
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  public get(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      if (!options) {
        throw new Error(
          `Circuit breaker "${name}" does not exist and no options provided to create it`,
        );
      }
      this.breakers.set(name, new CircuitBreaker(options));
    }
    return this.breakers.get(name)!;
  }

  public remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  public reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  public resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  public getStatus(): Record<string, { state: CircuitState }> {
    const status: Record<string, { state: CircuitState }> = {};
    this.breakers.forEach((breaker, name) => {
      status[name] = { state: breaker.getState() };
    });
    return status;
  }
}

// Export singleton instance
export const registry = new CircuitBreakerRegistry();
