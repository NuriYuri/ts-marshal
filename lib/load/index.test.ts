import { load } from '.';
import { isMarshalExtendableObject } from '../typeGuards';
import { MarshalObject } from '../types';

// Marshal.dump().each_byte.map { |i| sprintf('%02x', i) }.join
describe('Marshal', () => {
  describe('load', () => {
    it('loads basic string', () => {
      expect(load(Buffer.from('04084922105465737420737472696e67063a064554', 'hex'))).toEqual('Test string');
    });

    it('loads array with bool, null and ints', () => {
      expect(load(Buffer.from('04085b0f30544669006906690b692f69fa69f56998', 'hex'))).toEqual([null, true, false, 0, 1, 6, 42, -1, -6, -99]);
    });

    it('loads floats', () => {
      expect(load(Buffer.from('04085b0c6606316608312e356608326532660b2d3530302e3366086e616e6608696e6666092d696e66', 'hex'))).toEqual([
        1.0,
        1.5,
        200.0,
        -500.3,
        NaN,
        Infinity,
        -Infinity,
      ]);
    });

    it('loads bignums', () => {
      expect(
        load(
          Buffer.from(
            '04086c2b0181000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100',
            'hex',
          ),
        ),
      ).toEqual(
        BigInt(
          '32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385521914333389668342420684974786564569494856176035326322058077805659331026192708460314150258592864177116725943603718461857357598351152301645904403697613233287231227125684710820209725157101726931323469678542580656697935045997268352998638215525166389437335543602135433229604645318478604952148193555853611059596230656',
        ),
      );
    });

    it('loads regexp', () => {
      expect(
        load(Buffer.from('04085b09492f097465737400063a064546492f097465737401063b0046492f097465737404063b0046492f097465737405063b0046', 'hex')),
      ).toEqual([/test/, /test/i, /test/m, /test/im]);
    });

    it('loads class', () => {
      expect(load(Buffer.from('0408630b4f626a656374', 'hex'))).toEqual({ __class: 'Class', name: 'Object' });
    });

    it('loads modules', () => {
      expect(load(Buffer.from('04086d0b4b65726e656c', 'hex'))).toEqual({ __class: 'Module', name: 'Kernel' });
    });

    it('loads modules (old)', () => {
      expect(load(Buffer.from('04084d0b4b65726e656c', 'hex'))).toEqual({ __class: 'ModuleOrClass', name: 'Kernel' });
    });

    it('loads hashes', () => {
      expect(load(Buffer.from('04087b073a0661690049220662063a0645546906', 'hex'))).toEqual({ __class: 'Hash', [Symbol.for('a')]: 0, b: 1 });
    });

    it('loads hashes with default value', () => {
      expect(load(Buffer.from('04087d073a0661690049220662063a0645546906693c', 'hex'))).toEqual({
        __class: 'Hash',
        __default: 55,
        [Symbol.for('a')]: 0,
        b: 1,
      });
    });

    it('loads hashes with instance variables', () => {
      expect(load(Buffer.from('0408497b073a0661690049220662063a0645546906063a074061690a', 'hex'))).toEqual({
        __class: 'Hash',
        [Symbol.for('a')]: 0,
        b: 1,
        '@a': 5,
      });
    });

    it('loads extended hashes', () => {
      expect(load(Buffer.from('0408653a0e457874656e73696f6e7b063a06616900', 'hex'))).toEqual({
        __class: 'Hash',
        [Symbol.for('a')]: 0,
        __extendedModules: [
          {
            __class: 'Module',
            name: 'Extension',
          },
        ],
      });
    });

    it('loads hashes as Map', () => {
      expect(load(Buffer.from('04087b073a0661690049220662063a0645546906', 'hex'), undefined, { hashToJS: 'map' })).toEqual(
        new Map<MarshalObject, MarshalObject>([
          [Symbol.for('a'), 0],
          ['b', 1],
        ]),
      );
    });

    it('loads hashes as Map with default value as', () => {
      expect(load(Buffer.from('04087d073a0661690049220662063a0645546906693c', 'hex'), undefined, { hashToJS: 'map' })).toEqual(
        new Map<MarshalObject, MarshalObject>([
          ['__default', 55],
          [Symbol.for('a'), 0],
          ['b', 1],
        ]),
      );
    });

    it('loads hashes as Map with instance variables', () => {
      expect(load(Buffer.from('0408497b073a0661690049220662063a0645546906063a074061690a', 'hex'), undefined, { hashToJS: 'map' })).toEqual(
        new Map<MarshalObject, MarshalObject>([
          [Symbol.for('a'), 0],
          ['b', 1],
          ['@a', 5],
        ]),
      );
    });

    it('loads extended hashes as Map', () => {
      expect(load(Buffer.from('0408653a0e457874656e73696f6e7b063a06616900', 'hex'), undefined, { hashToJS: 'map' })).toEqual(
        new Map<MarshalObject, MarshalObject>([
          [Symbol.for('a'), 0],
          [
            '__extendedModules',
            [
              {
                __class: 'Module',
                name: 'Extension',
              },
            ],
          ],
        ]),
      );
    });

    it('loads standard object', () => {
      expect(load(Buffer.from('04086f3a10506f696e744f626a656374073a07407869093a074079690a', 'hex'))).toEqual({
        __class: Symbol.for('PointObject'),
        '@x': 4,
        '@y': 5,
      });
    });

    it('loads extended object', () => {
      expect(
        load(
          Buffer.from(
            '0408653a125072657474795072696e746572653a0c506f696e7433446f3a10506f696e744f626a656374083a07407869003a07407969003a07407a6906',
            'hex',
          ),
        ),
      ).toEqual({
        __class: Symbol.for('PointObject'),
        __extendedModules: [
          { __class: 'Module', name: 'PrettyPrinter' },
          { __class: 'Module', name: 'Point3D' },
        ],
        '@x': 0,
        '@y': 0,
        '@z': 1,
      });
    });

    it('loads object with marshal_dump data', () => {
      expect(load(Buffer.from('0408553a104d61727368616c44756d7049220e536f6d652044617461063a064554', 'hex'))).toEqual({
        __class: Symbol.for('MarshalDump'),
        __marshal_load: 'Some Data',
      });
    });

    it('loads object with _dump data', () => {
      expect(load(Buffer.from('040849753a0f446174614f626a65637413536f6d6542696e61727944617461063a064554', 'hex'))).toEqual({
        __class: Symbol.for('DataObject'),
        __load: Buffer.from('SomeBinaryData', 'utf8'),
        __encoding: 'utf8',
      });
    });

    it('loads structs', () => {
      expect(load(Buffer.from('0408533a10506f696e74537472756374073a067869063a06796907', 'hex'))).toEqual({
        __class: Symbol.for('PointStruct'),
        __type: 'Struct',
        x: 1,
        y: 2,
      });
    });

    it('loads extended structs', () => {
      expect(load(Buffer.from('040849653a0e457874656e73696f6e533a10506f696e74537472756374073a067869003a06796906063a07407a690a', 'hex'))).toEqual({
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
      });
    });

    it('loads symbol links with no issue', () => {
      expect(load(Buffer.from('04085b083a0b73796d626f6c3b003b00', 'hex'))).toEqual([
        Symbol.for('symbol'),
        Symbol.for('symbol'),
        Symbol.for('symbol'),
      ]);
    });

    it('loads object links with no issue', () => {
      const struct = {
        __class: Symbol.for('PointStruct'),
        __type: 'Struct',
        x: 1,
        y: 2,
      };
      const loaded = load(Buffer.from('04085b08533a10506f696e74537472756374073a067869063a0679690740064006', 'hex')) as unknown[];
      expect(loaded).toEqual([struct, struct, struct]);
      expect(loaded[0] === loaded[1]).toEqual(true);
    });

    it('loads mixed symbol & object links with no issues', () => {
      const struct = {
        __class: Symbol.for('PointStruct'),
        __type: 'Struct',
        x: 1,
        y: 2,
      };
      const loaded = load(Buffer.from('04085b08533a10506f696e74537472756374073a067869063a067969074006533b00073b0669083b076909', 'hex')) as unknown[];
      expect(loaded).toEqual([
        struct,
        struct,
        {
          __class: Symbol.for('PointStruct'),
          __type: 'Struct',
          x: 3,
          y: 4,
        },
      ]);
      expect(loaded[0] === loaded[1]).toEqual(true);
    });
  });

  describe('load with map', () => {
    const map = jest.fn();
    beforeEach(() => {
      map.mockReset();
      map.mockImplementation((d) => d);
    });

    it('maps each values even if they repeat', () => {
      // [0, 0, 1, 2, true, true, false, false, nil]
      load(Buffer.from('04085b0e69006900690669075454464630', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, 0);
      expect(map).toHaveBeenNthCalledWith(2, 0);
      expect(map).toHaveBeenNthCalledWith(3, 1);
      expect(map).toHaveBeenNthCalledWith(4, 2);
      expect(map).toHaveBeenNthCalledWith(5, true);
      expect(map).toHaveBeenNthCalledWith(6, true);
      expect(map).toHaveBeenNthCalledWith(7, false);
      expect(map).toHaveBeenNthCalledWith(8, false);
      expect(map).toHaveBeenNthCalledWith(9, null);
      expect(map).toHaveBeenNthCalledWith(10, [0, 0, 1, 2, true, true, false, false, null]);
    });

    it('maps floats properly', () => {
      load(Buffer.from('04085b0c6606316608312e356608326532660b2d3530302e3366086e616e6608696e6666092d696e66', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, 1.0);
      expect(map).toHaveBeenNthCalledWith(2, 1.5);
      expect(map).toHaveBeenNthCalledWith(3, 200.0);
      expect(map).toHaveBeenNthCalledWith(4, -500.3);
      expect(map).toHaveBeenNthCalledWith(5, NaN);
      expect(map).toHaveBeenNthCalledWith(6, Infinity);
      expect(map).toHaveBeenNthCalledWith(7, -Infinity);
      expect(map).toHaveBeenNthCalledWith(8, [1.0, 1.5, 200.0, -500.3, NaN, Infinity, -Infinity]);
    });

    it('maps module and classes when they are object themselves', () => {
      // a = Object.new
      // a.extend(Extension)
      // [Object, Object, Extension, Object.new, a]
      load(Buffer.from('04085b0a630b4f626a65637440066d0e457874656e73696f6e6f3a0b4f626a65637400653a0e457874656e73696f6e6f3b0000', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, { __class: 'Class', name: 'Object' });
      expect(map).toHaveBeenNthCalledWith(2, { __class: 'Class', name: 'Object' });
      expect(map).toHaveBeenNthCalledWith(3, { __class: 'Module', name: 'Extension' });
      expect(map).toHaveBeenNthCalledWith(4, { __class: Symbol.for('Object') });
      expect(map).toHaveBeenNthCalledWith(5, { __class: Symbol.for('Object'), __extendedModules: [{ __class: 'Module', name: 'Extension' }] });
      expect(map).toHaveBeenNthCalledWith(6, [
        { __class: 'Class', name: 'Object' },
        { __class: 'Class', name: 'Object' },
        { __class: 'Module', name: 'Extension' },
        { __class: Symbol.for('Object') },
        { __class: Symbol.for('Object'), __extendedModules: [{ __class: 'Module', name: 'Extension' }] },
      ]);
    });

    it('maps strings and encodings but does not repeat encoding for object link', () => {
      // [a='str',a]
      load(Buffer.from('04085b07492208737472063a0645544006', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, true); // In ruby true happens after first 'str'
      expect(map).toHaveBeenNthCalledWith(2, 'str');
      expect(map).toHaveBeenNthCalledWith(3, 'str');
      expect(map).toHaveBeenNthCalledWith(4, ['str', 'str']);
    });

    it('maps regexp and encodings but does not repeat encoding for object link', () => {
      // [a=/test/i,a]
      load(Buffer.from('04085b07492f097465737401063a0645464006', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, false); // In ruby false happens before first /test/
      expect(map).toHaveBeenNthCalledWith(2, /test/i);
      expect(map).toHaveBeenNthCalledWith(3, /test/i);
      expect(map).toHaveBeenNthCalledWith(4, [/test/i, /test/i]);
    });

    it('maps symbols only once', () => {
      // [:test, :test, :truc]
      load(Buffer.from('04085b083a09746573743b003a0974727563', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, Symbol.for('test'));
      expect(map).toHaveBeenNthCalledWith(2, Symbol.for('truc'));
      expect(map).toHaveBeenNthCalledWith(3, [Symbol.for('test'), Symbol.for('test'), Symbol.for('truc')]);
    });

    it('maps symbols only once and handle encoding as explaind in readme', () => {
      // [:tést, :tést, :trùc]
      load(Buffer.from('04085b08493a0a74c3a97374063a0645543b00493a0a7472c3b963063b0654', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, true);
      expect(map).toHaveBeenNthCalledWith(2, Symbol.for('tést'));
      expect(map).toHaveBeenNthCalledWith(3, true);
      expect(map).toHaveBeenNthCalledWith(4, Symbol.for('trùc'));
      expect(map).toHaveBeenNthCalledWith(5, [Symbol.for('tést'), Symbol.for('tést'), Symbol.for('trùc')]);
    });

    it('maps objects properly but does not call mapper for ivar symbols', () => {
      // a = Object.new
      // a.extends(Extension)
      // a.instance_variable_set(:@a, 1)
      // a.instance_variable_set(:@b, 2)
      // [a, a]
      const buffer = Buffer.from('04085b07653a0e457874656e73696f6e6f3a0b4f626a656374073a07406169063a07406269074006', 'hex');
      load(buffer, map);
      expect(map).toHaveBeenNthCalledWith(1, 1);
      expect(map).toHaveBeenNthCalledWith(2, 2);
      expect(map).toHaveBeenNthCalledWith(3, {
        '@a': 1,
        '@b': 2,
        __class: Symbol.for('Object'),
        __extendedModules: [{ __class: 'Module', name: 'Extension' }],
      });
      expect(map).toHaveBeenNthCalledWith(4, {
        '@a': 1,
        '@b': 2,
        __class: Symbol.for('Object'),
        __extendedModules: [{ __class: 'Module', name: 'Extension' }],
      });
      expect(map).toHaveBeenNthCalledWith(5, [
        { '@a': 1, '@b': 2, __class: Symbol.for('Object'), __extendedModules: [{ __class: 'Module', name: 'Extension' }] },
        { '@a': 1, '@b': 2, __class: Symbol.for('Object'), __extendedModules: [{ __class: 'Module', name: 'Extension' }] },
      ]);

      // Since jest doesn't seem to deep copy objects we need to manually check extension happens after the call first call of mapper ;)
      const extendedChecker: boolean[] = [];
      load(buffer, (o) => {
        if (isMarshalExtendableObject(o)) {
          extendedChecker.push(o.__extendedModules ? true : false);
        }
        return o;
      });
      expect(extendedChecker).toEqual([false, true]);
    });

    it('maps only values of structs', () => {
      // PointStruct.new(0, 1)
      load(Buffer.from('0408533a10506f696e74537472756374073a067869003a06796906', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, 0);
      expect(map).toHaveBeenNthCalledWith(2, 1);
      expect(map).toHaveBeenNthCalledWith(3, {
        __class: Symbol.for('PointStruct'),
        __type: 'Struct',
        x: 0,
        y: 1,
      });
    });

    it('maps key and values of Hashes but does not repeat symbols', () => {
      // [:a, false, { a: 0, b: 1, 'a' => 1 }]
      load(Buffer.from('04085b083a0661467b083b0069003a0662690649220661063a0645546906', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, Symbol.for('a'));
      expect(map).toHaveBeenNthCalledWith(2, false);
      expect(map).toHaveBeenNthCalledWith(3, 0);
      expect(map).toHaveBeenNthCalledWith(4, Symbol.for('b'));
      expect(map).toHaveBeenNthCalledWith(5, 1);
      expect(map).toHaveBeenNthCalledWith(6, true); // 'a' is encoded UTF-8
      expect(map).toHaveBeenNthCalledWith(7, 'a');
      expect(map).toHaveBeenNthCalledWith(8, 1);
      expect(map).toHaveBeenNthCalledWith(9, { __class: 'Hash', a: 1, [Symbol.for('a')]: 0, [Symbol.for('b')]: 1 });
      expect(map).toHaveBeenNthCalledWith(10, [Symbol.for('a'), false, { __class: 'Hash', a: 1, [Symbol.for('a')]: 0, [Symbol.for('b')]: 1 }]);
    });

    it('maps marshal_load/dump objects in right order', () => {
      // class MarshalDump
      //  def marshal_dump
      //    'test'
      //  end
      //  def marshal_load(*)
      //    MarshalDump.new
      //  end
      // end
      // MarshalDump.new
      load(Buffer.from('0408553a104d61727368616c44756d7049220974657374063a064554', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, true);
      expect(map).toHaveBeenNthCalledWith(2, 'test');
      expect(map).toHaveBeenNthCalledWith(3, { __class: Symbol.for('MarshalDump'), __marshal_load: 'test' });
    });

    it('only maps the finaly object when it should repond to _dump', () => {
      // class PointByte
      //   def _dump(*)
      //     [@x, @y].pack('CC')
      //   end
      //   def self._load(v, *)
      //     PointByte.new(*v.unpack('CC'))
      //   end
      //   def initialize(x, y)
      //     @x = x
      //     @y = y
      //   end
      // end
      // PointByte.new(5, 6)
      load(Buffer.from('0408753a0e506f696e7442797465070506', 'hex'), map);
      expect(map).toHaveBeenNthCalledWith(1, { __class: Symbol.for('PointByte'), __load: Buffer.from('0506', 'hex') });
    });
  });
});
