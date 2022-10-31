# ts-marshal

Typescript library helping to load and dump Ruby Marshal objects through `Marshal.load(buffer)` an `Marshal.dump(object)`.

## Installation

With npm

```sh
npm i ts-marshal
```

With yarn:
```sh
yarn add ts-marshal
```

## Usage

This library works almost the same as `Marshal` in Ruby. It just doesn't supports limit.

### Dump an object

```ts
const buffer = Marshal.dump(objectToDump);
```

### Load an object

```ts
const objet = Marshal.load(bufferToLoad);
```

### Load an object with mapping

```ts
const object = Marshal.load(bufferToLoad, (o) => (typeof o === 'number' ? o * 2 : o));
```

### Type checking

This library exports type guards for the specific objects. As you may know, ruby saves various kind of objects, this means you cannot just assume the output of `Marshal.load` is a Hash encoded as a JSON object.

To check the various kind of object use:
* `isMarshalExtendableObject(object)` to verify that the object can have `__extendedModules` property.
* `isMarshalClassObject(object)` to verify that the object is a Ruby class
* `isMarshalModuleObject(object)` to verify that the object is a Ruby module
* `isMarshalModuleOrClassObject(object)` to verify that that the object is either a class or module object (old marshal format)
* `isMarshalHash(object)` to verify that the object is a Ruby Hash (so it's not confused with a normal object)
* `isMarshalStandardObject(object)` to verify that the object is a standard Ruby object (no special dump/load behavior)
* `isMarshalMarshalObject(object)` to verify that the object is supposed to respond to `marshal_load`
* `isMarshalDataObject(object)` to verify that the object is supposed to respond to `_load_data`
* `isMarshalUserObject(object)` to verify that the object is supposed to respond to `_load`
* `isMarshalStructObject(object)` to verify that the object is a Ruby Struct.

### Working around instance variables

Typing the name of the Ruby instance variable is not really JS friendly. You can use getters and setters to overcome this issue:

```ts
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
```

### Working with User defined objects

User defined objects are even worse to work with because they contain a binary buffer holding the data. Fortunately getter can help us making a dump-able object while working with usable properties.

```ts
const makeDumpAbleColor = (r: number, g: number, b: number, a: number) => ({
      __class: Symbol.for('Color'),
      r, g, b, a,
      get __load() {
        const buff = Buffer.allocUnsafe(4);
        buff.writeUint8(this.r & 0xFF, 0);
        buff.writeUint8(this.g & 0xFF, 1);
        buff.writeUint8(this.b & 0xFF, 2);
        buff.writeUint8(this.a & 0xFF, 3);
        return buff;
      },
});
```

Since `Marshal.load` construct the object itself, you might use the map function argument from `Marshal.load` to pass the loaded object to a factory function that will build the correct object.

## Considerations

This library is not 100% complete and also can't reproduce Ruby behavior at 100% because of Java Script differences with Ruby.

1. JS doesn't have a different type for Integer & Floats, this means 0.0 is an integer, data loss may be expected while dumping JS objects.
2. JS primitive data types cannot be extended. This means UClass and Extended object marshal stuff isn't supported properly for those objects.
3. Implementation of UClass isn't done properly, this mean Hash with different classes might get dumped as object and crash on Ruby load.
4. Ruby and JS Regexp doesn't have the same set of flags, only `i` and `m` flags are supported.
5. Hashes uses JS `Symbol` for Symbol keys while objects and struct will just use string (as difference between string and symbol isn't expected).
6. Class names in Object are using Symbol but not in Class Objects. Putting aside `Hash` which stays a string.
7. Ruby Symbols are loaded as JS Symbols
8. JS Symbol must be generated using `Symbol.for`
9. Ruby has much more encoding than JS, some encoding from marshal data might be lost in the process and data might look junky
10. The map function for `Marshal.dump` is not called it the same order as Ruby does for encoded entities, first encoding info is mapped then the final entity with its own encoding. Ruby does the opposite, it's mainly due to implementation.
11. Regexp are getting their encoding processed in the right order (encoding first, regexp second)
12. UTF-8 is the standard encoding for anything else than UserDef objects.
13. This library is still in early stages, we can improve it or even introduce breaking changes (as long as it doesn't break buffer encoding)
