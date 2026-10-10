import { Sparkles } from 'lucide-react';
import { HABIT_ICONS } from './habitIcons';

/** Renders a habit icon by its stored key (e.g. habit.icon = 'cup-soda'). */
function Icon({ name, ...props }) {
  const Cmp = HABIT_ICONS[name] || Sparkles;
  return <Cmp {...props} />;
}

export default Icon;
