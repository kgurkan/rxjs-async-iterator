import Bluebird from 'bluebird';
import {config} from 'rxjs';
import {PendingPromise} from './pending-promise';

describe('PendingPromise', () => {

  describe.each([
    ['Native Promise', Promise],
    ['Custom Promise (Bluebird)', Bluebird],
    ['Auto-detected Promise Constructor', undefined],
  ] as any)('With PromiseCtor: %s', (label: string, PromiseCtor: PromiseConstructorLike | undefined) => {

    it('should create resolved promise statically', async () => {
      const pending = PendingPromise.resolve(PromiseCtor);
      const result = await pending.promise;

      expect(pending.settled).toBeTruthy();
      expect(result).toEqual({done: true});
    });

    it('should create rejected promise statically', async (done: jest.DoneCallback) => {
      const testError = new Error('Test');
      const pending = PendingPromise.reject(testError, PromiseCtor);
      expect(pending.settled).toBeTruthy();

      try {
        await pending.promise;
        done.fail('Should throw');
      } catch (e) {
        expect(e).toBe(testError);
        done();
      }
    });

    it('should resolve', async () => {
      const testValue = 1;
      const pending = new PendingPromise<number>(PromiseCtor);

      pending.resolve(testValue);
      expect(pending.settled).toBeTruthy();
      expect(await pending.promise).toEqual({done: false, value: testValue});
    });

    it('should reject', async (done: jest.DoneCallback) => {
      const testError = new Error('Test error');
      const pending = new PendingPromise(PromiseCtor);
      pending.reject(testError);
      expect(pending.settled).toBeTruthy();

      try {
        await pending.promise;
        done.fail('Should throw');
      } catch (e) {
        expect(e).toBe(testError);
        done();
      }
    });

  });

  describe('PromiseCtor detection', () => {
    const defaults = {globalConfig: (self as any).Promise, rxjsConfig: config.Promise};
    afterEach(() => configurePromiseCtors(defaults));

    function configurePromiseCtors({globalConfig, rxjsConfig}: { globalConfig: any, rxjsConfig: any }) {
      (config as any).Promise = rxjsConfig;
      (self as any).Promise = globalConfig;
    }

    it('should throw when no native promises are found', () => {
      configurePromiseCtors({globalConfig: undefined, rxjsConfig: undefined});
      expect(() => new PendingPromise()).toThrow(/not supported/);
    });

    it('should construct from custom PromiseCtor via RxJs config', async () => {
      configurePromiseCtors({globalConfig: undefined, rxjsConfig: Bluebird});
      expect(() => new PendingPromise()).not.toThrow();
    });

  });

});
