import { useState } from 'react';
import './App.css';
import { AppProvider } from './store/AppStore';
import { useApp } from './store/useApp';
import { FocusTimerProvider } from './features/focus/FocusTimerProvider';
import Sidebar, { MobileBar } from './features/shell/Sidebar';
import Welcome from './features/shell/Welcome';
import HeroScene from './features/home/HeroScene';
import HabitStrip from './features/home/HabitStrip';
import WeeklyWidget from './features/home/WeeklyWidget';
import TodayTasks from './features/tasks/TodayTasks';
import TasksPage from './features/tasks/TasksPage';
import ArchivePage from './features/tasks/ArchivePage';
import FocusWidget from './features/focus/FocusWidget';
import FocusPage from './features/focus/FocusPage';
import CalendarWidget from './features/calendar/CalendarWidget';
import CalendarPage from './features/calendar/CalendarPage';
import UpcomingWidget from './features/calendar/UpcomingWidget';
import NotesWidget from './features/notes/NotesWidget';
import NotesPage from './features/notes/NotesPage';
import HabitsPage from './features/habits/HabitsPage';

function HomePage() {
  return (
    <div className="dashboard">
      <div className="area-hero rise"><HeroScene /></div>
      <div className="area-focus rise" style={{ animationDelay: '60ms' }}><FocusWidget /></div>
      <div className="area-strip rise" style={{ animationDelay: '90ms' }}><HabitStrip /></div>
      <div className="area-cal rise" style={{ animationDelay: '120ms' }}><CalendarWidget /></div>
      <div className="area-tasks rise" style={{ animationDelay: '150ms' }}><TodayTasks /></div>
      <div className="area-week rise" style={{ animationDelay: '180ms' }}><WeeklyWidget /></div>
      <div className="area-upcoming rise" style={{ animationDelay: '210ms' }}><UpcomingWidget /></div>
      <div className="area-notes rise" style={{ animationDelay: '240ms' }}><NotesWidget /></div>
    </div>
  );
}

const PAGES = {
  home: HomePage,
  tasks: TasksPage,
  calendar: CalendarPage,
  focus: FocusPage,
  habits: HabitsPage,
  notes: NotesPage,
  archive: ArchivePage,
};

function Shell() {
  const { view } = useApp();
  // the mobile drawer belongs to the view it was opened on, so navigating closes it
  const [navOpenOn, setNavOpenOn] = useState(null);
  const navOpen = navOpenOn === view;
  const Page = PAGES[view] || HomePage;

  return (
    <div className="app">
      <Sidebar open={navOpen} onClose={() => setNavOpenOn(null)} />
      <div className="app-main">
        <MobileBar onMenu={() => setNavOpenOn(view)} />
        <main className="page" key={view}>
          <Page />
        </main>
      </div>
      <Welcome />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <FocusTimerProvider>
        <Shell />
      </FocusTimerProvider>
    </AppProvider>
  );
}

export default App;
