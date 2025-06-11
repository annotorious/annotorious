import { Annotator } from '@annotorious/react';
import { useContext, useEffect } from 'react';
import { PluginProviderContext } from './PluginProvider';

interface PluginProps {

  name: string;

  plugin: (anno: Annotator, opts?: any) => unknown;

  opts?: any;

}

export const Plugin = (props: PluginProps) => {

  const { setPlugins } = useContext(PluginProviderContext);

  useEffect(() => {
    setPlugins(current => new Map(current).set(props.name, { mountFn: props.plugin, opts: props.opts }));

    return () => {
      setPlugins(current => {
        const updated = new Map(current);
        updated.delete(props.name);
        return updated;
      });
    }
  }, []);

  return null;

}