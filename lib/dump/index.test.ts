import { dump } from '.';

// str.each_char.each_slice(2).map { |s| s.join.to_i(16).chr }.join
describe('Marshal', () => {
  describe('dump', () => {
    it('dumps array with bool, null and ints', () => {
      expect(dump([null, true, false, 0, 1, 6, 42, -1, -6, -99])).toEqual(Buffer.from('04085b0f30544669006906690b692f69fa69f56998', 'hex'));
    });

    it('dumps strings', () => {
      expect(dump(['test', 'tést'])).toEqual(Buffer.from('04085b0749220974657374063a06455449220a74c3a97374063b0054', 'hex'));
    });

    it('dumps floats', () => {
      expect(dump([1.5, -500.3, NaN, Infinity, -Infinity])).toEqual(
        Buffer.from('04085b0a6608312e35660b2d3530302e3366084e614e6608696e6666092d696e66', 'hex'),
      );
    });

    it('dumps bignums', () => {
      expect(
        dump(
          BigInt(
            '32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385521914333389668342420684974786564569494856176035326322058077805659331026192708460314150258592864177116725943603718461857357598351152301645904403697613233287231227125684710820209725157101726931323469678542580656697935045997268352998638215525166389437335543602135433229604645318478604952148193555853611059596230656',
          ),
        ),
      ).toEqual(
        Buffer.from(
          '04086c2b0181000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100',
          'hex',
        ),
      );
    });

    it('dumps symbols', () => {
      expect(dump([Symbol.for('a'), Symbol.for('é'), Symbol.for('a')])).toEqual(Buffer.from('04085b083a0661493a07c3a9063a0645543b00', 'hex'));
    });

    it('dumps regexp', () => {
      expect(dump([/test/, /test/i, /test/m, /test/im])).toEqual(
        Buffer.from('04085b09492f097465737400063a064554492f097465737401063b0054492f097465737404063b0054492f097465737405063b0054', 'hex'),
      );
    });

    it('dumps class', () => {
      expect(dump({ __class: 'Class', name: 'Object' })).toEqual(Buffer.from('0408630b4f626a656374', 'hex'));
    });

    it('dumps modules', () => {
      expect(dump({ __class: 'Module', name: 'Kernel' })).toEqual(Buffer.from('04086d0b4b65726e656c', 'hex'));
    });

    it('dumps modules (old)', () => {
      expect(dump({ __class: 'ModuleOrClass', name: 'Kernel' })).toEqual(Buffer.from('04084d0b4b65726e656c', 'hex'));
    });

    it('dumps hashes', () => {
      expect(dump({ __class: 'Hash', [Symbol.for('a')]: 0, b: 1 })).toEqual(Buffer.from('04087b0749220662063a06455469063a06616900', 'hex'));
    });

    it('dumps hashes with default value', () => {
      expect(
        dump({
          __class: 'Hash',
          __default: 55,
          [Symbol.for('a')]: 0,
          b: 1,
        }),
      ).toEqual(Buffer.from('04087d0749220662063a06455469063a06616900693c', 'hex'));
    });

    it('dumps hashes with instance variables', () => {
      expect(
        dump({
          __class: 'Hash',
          [Symbol.for('a')]: 0,
          b: 1,
          '@a': 5,
        }),
      ).toEqual(Buffer.from('0408497b0749220662063a06455469063a06616900063a074061690a', 'hex'));
    });

    it('dumps extended hashes', () => {
      expect(
        dump({
          __class: 'Hash',
          [Symbol.for('a')]: 0,
          __extendedModules: [
            {
              __class: 'Module',
              name: 'Extension',
            },
          ],
        }),
      ).toEqual(Buffer.from('0408653a0e457874656e73696f6e7b063a06616900', 'hex'));
    });

    it('dumps standard object', () => {
      expect(
        dump({
          __class: Symbol.for('PointObject'),
          '@x': 4,
          '@y': 5,
        }),
      ).toEqual(Buffer.from('04086f3a10506f696e744f626a656374073a07407869093a074079690a', 'hex'));
    });

    it('dumps extended object', () => {
      expect(
        dump({
          __class: Symbol.for('PointObject'),
          __extendedModules: [
            { __class: 'Module', name: 'PrettyPrinter' },
            { __class: 'Module', name: 'Point3D' },
          ],
          '@x': 0,
          '@y': 0,
          '@z': 1,
        }),
      ).toEqual(
        Buffer.from(
          '0408653a125072657474795072696e746572653a0c506f696e7433446f3a10506f696e744f626a656374083a07407869003a07407969003a07407a6906',
          'hex',
        ),
      );
    });

    it('dumps extended object made from JS world', () => {
      const makePointObject = (x: number, y: number, z: number) => {
        const pointObject = {
          __class: Symbol.for('PointObject'),
          __extendedModules: [
            { __class: 'Module' as const, name: 'PrettyPrinter' },
            { __class: 'Module' as const, name: 'Point3D' },
          ],
          get x() {
            return this['@x'] as number;
          },
          set x(v: number) {
            this['@x'] = v;
          },
          get y() {
            return this['@y'] as number;
          },
          set y(v: number) {
            this['@y'] = v;
          },
          get z() {
            return this['@z'] as number;
          },
          set z(v: number) {
            this['@z'] = v;
          },
        };
        pointObject.x = x; // Written like this to prove setter works
        pointObject.y = y;
        pointObject.z = z;
        return pointObject;
      };
      expect(dump(makePointObject(0, 0, 1))).toEqual(
        Buffer.from(
          '0408653a125072657474795072696e746572653a0c506f696e7433446f3a10506f696e744f626a656374083a07407869003a07407969003a07407a6906',
          'hex',
        ),
      );
    });

    it('dumps object with marshal_dump data', () => {
      expect(
        dump({
          __class: Symbol.for('MarshalDump'),
          __marshal_load: 'Some Data',
        }),
      ).toEqual(Buffer.from('0408553a104d61727368616c44756d7049220e536f6d652044617461063a064554', 'hex'));
    });

    it('dumps object with _dump data', () => {
      expect(
        dump({
          __class: Symbol.for('DataObject'),
          __load: Buffer.from('SomeBinaryData', 'utf8'),
          __encoding: 'utf8',
        }),
      ).toEqual(Buffer.from('040849753a0f446174614f626a65637413536f6d6542696e61727944617461063a064554', 'hex'));
    });

    it('dumps object with _dump backed off instance variables', () => {
      const object = {
        __class: Symbol.for('DataObject'),
        __encoding: 'utf8',
        some: 'Some',
        binary: 'Binary',
        data: 'Data',
        get __load() {
          return Buffer.from(`${this.some}${this.binary}${this.data}`, 'utf8');
        },
      };
      expect(dump(object)).toEqual(Buffer.from('040849753a0f446174614f626a65637413536f6d6542696e61727944617461063a064554', 'hex'));
    });

    it('dumps structs', () => {
      expect(
        dump({
          __class: Symbol.for('PointStruct'),
          __type: 'Struct',
          x: 1,
          y: 2,
        }),
      ).toEqual(Buffer.from('0408533a10506f696e74537472756374073a067869063a06796907', 'hex'));
    });

    it('dumps extended structs', () => {
      expect(
        dump({
          __class: Symbol.for('PointStruct'),
          __type: 'Struct',
          x: 0,
          y: 1,
          '@z': 5,
          __extendedModules: [
            {
              __class: 'Module',
              name: 'Extension',
            },
          ],
        }),
      ).toEqual(Buffer.from('040849653a0e457874656e73696f6e533a10506f696e74537472756374073a067869003a06796906063a07407a690a', 'hex'));
    });

    it('dumps object links with no issue', () => {
      const struct = {
        __class: Symbol.for('PointStruct'),
        __type: 'Struct',
        x: 1,
        y: 2,
      };
      expect(dump([struct, struct, struct])).toEqual(Buffer.from('04085b08533a10506f696e74537472756374073a067869063a0679690740064006', 'hex'));
    });

    it('dumps mixed symbol & object links with no issues', () => {
      const struct = {
        __class: Symbol.for('PointStruct'),
        __type: 'Struct',
        x: 1,
        y: 2,
      };
      expect(
        dump([
          struct,
          struct,
          {
            __class: Symbol.for('PointStruct'),
            __type: 'Struct',
            x: 3,
            y: 4,
          },
        ]),
      ).toEqual(Buffer.from('04085b08533a10506f696e74537472756374073a067869063a067969074006533b00073b0669083b076909', 'hex'));
    });
  });
});
