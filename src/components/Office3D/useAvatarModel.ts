import { useEffect, useState } from 'react';

export function useAvatarModel(agentId: string) {
  const [modelExists, setModelExists] = useState<boolean | null>(null);
  const modelPath = `/models/${agentId}.glb`;

  useEffect(() => {
    fetch(modelPath, { method: 'HEAD' })
      .then((response) => setModelExists(response.ok))
      .catch(() => setModelExists(false));
  }, [modelPath]);

  return { model: null, loading: modelExists === null, modelExists: modelExists === true };
}
