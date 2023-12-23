export type MarshalLoadConfig = {
  hashToJS: 'legacy' | 'map';
};

export type MarshalDumpConfig = {
  /* Omit encoding for RMXP compatibility */
  omitStringEncoding: boolean;
};

export type MarshalConfig = Readonly<{
  load: Readonly<MarshalLoadConfig>;
  dump: Readonly<MarshalDumpConfig>;
}>;

let config: MarshalConfig = {
  load: {
    hashToJS: 'legacy',
  },
  dump: {
    omitStringEncoding: false,
  },
};

export const getMarshalConfig = () => config;
export const getMarshalDumpConfig = () => config.dump;
export const getMarshalLoadConfig = () => config.load;

export const setMarshalConfig = (newConfig: { load: MarshalLoadConfig; dump: MarshalDumpConfig }) => {
  config = JSON.parse(JSON.stringify(newConfig));
};

export const setMarshalDumpConfig = (newConfig: MarshalDumpConfig) => {
  config = {
    ...config,
    dump: JSON.parse(JSON.stringify(newConfig)),
  };
};

export const setMarshalLoadConfig = (newConfig: MarshalLoadConfig) => {
  config = {
    ...config,
    load: JSON.parse(JSON.stringify(newConfig)),
  };
};

export const mergeConfig = (config: Partial<MarshalConfig>): MarshalConfig => {
  return {
    ...getMarshalConfig(),
    ...JSON.parse(JSON.stringify(config)),
  };
};
