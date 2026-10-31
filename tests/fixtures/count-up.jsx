import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useCountUp } from '../../src/lib/hooks.jsx';

function Fixture() {
  const [target, setTarget] = useState(15000);
  const value = useCountUp(target, 1000);

  useEffect(() => {
    window.setCountUpTarget = setTarget;
    return () => { delete window.setCountUpTarget; };
  }, []);
  useEffect(() => {
    // Runs after the hook's effect, so the test can safely advance a new frame.
    window.countUpTargetCommitted = target;
  }, [target]);

  return <output id="value" data-target={target}>{value}</output>;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Fixture /></React.StrictMode>,
);
