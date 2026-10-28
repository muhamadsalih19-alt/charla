import { useState } from 'react';
import { AppProvider, useApp } from './state';
import type { Scenario } from './data/scenarios';
import type { Unit } from './data/units';
import type { ChatTurn } from './lib/types';
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';
import { HablarList } from './screens/HablarList';
import { Conversation } from './screens/Conversation';
import { SessionEnd } from './screens/SessionEnd';
import { Practicar } from './screens/Practicar';
import { UnitScreen } from './screens/UnitScreen';
import { DrillSession } from './screens/DrillSession';
import { CardReview } from './screens/CardReview';
import { SettingsScreen } from './screens/Settings';

export type Screen =
  | { name: 'home' }
  | { name: 'welcome' }
  | { name: 'hablar' }
  | { name: 'conversation'; scenario: Scenario }
  | { name: 'session-end'; scenario: Scenario; turns: ChatTurn[] }
  | { name: 'practicar' }
  | { name: 'unit'; unit: Unit }
  | { name: 'drills'; unit: Unit }
  | { name: 'cards' }
  | { name: 'settings' };

export type Go = (s: Screen) => void;

function Router() {
  const { data } = useApp();
  const [screen, setScreen] = useState<Screen>(data.settings.learnerName ? { name: 'home' } : { name: 'welcome' });
  // bumps on every navigation so revisiting a screen starts it fresh
  const [visit, setVisit] = useState(0);
  const go: Go = (s) => {
    setScreen(s);
    setVisit((v) => v + 1);
    window.scrollTo(0, 0);
  };

  switch (screen.name) {
    case 'welcome':
      return <Welcome go={go} />;
    case 'hablar':
      return <HablarList go={go} />;
    case 'conversation':
      return <Conversation key={visit} scenario={screen.scenario} go={go} />;
    case 'session-end':
      return <SessionEnd key={visit} scenario={screen.scenario} turns={screen.turns} go={go} />;
    case 'practicar':
      return <Practicar go={go} />;
    case 'unit':
      return <UnitScreen key={visit} unit={screen.unit} go={go} />;
    case 'drills':
      return <DrillSession key={visit} unit={screen.unit} go={go} />;
    case 'cards':
      return <CardReview key={visit} go={go} />;
    case 'settings':
      return <SettingsScreen go={go} />;
    default:
      return <Home go={go} />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
