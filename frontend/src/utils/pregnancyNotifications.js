const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_DAYS = 280;
const POSTPARTUM_BUFFER_DAYS = 42;

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function weekAndCountdown(dueDate, today) {
  const daysElapsed = TOTAL_PREGNANCY_DAYS - Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY);
  const clamped = Math.min(TOTAL_PREGNANCY_DAYS, Math.max(0, daysElapsed));
  const week = Math.min(40, Math.floor(clamped / 7) + 1);
  const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY));
  return { week, daysUntilDue };
}

const SIZE_MILESTONES = {
  12: { icon: "🍑", message: "Your baby is the size of a plum! They are practicing their swallowing and can even frown now." },
  20: { icon: "🍌", message: "Your baby is the size of a banana and is starting to hear your voice!" },
  30: { icon: "🥬", message: "Your baby is as big as a cabbage! You're in the home stretch." },
};

const BABY_PERSONA = {
  16: "Hi Mom! 👋 I just did a somersault and I'm growing my own hair. Have a great day!",
  24: "I can hear the music you've been playing! 🎶 Let's groove together.",
  36: "I'm running out of space in here! Time to practice stretching and getting ready for the big day.",
};

export function getPregnancyNotifications({ dueDate, today = new Date(), reminders = [] }) {
  if (!dueDate) return [];

  const daysPastDue = (today.getTime() - dueDate.getTime()) / MS_PER_DAY;
  if (daysPastDue >= POSTPARTUM_BUFFER_DAYS) return [];

  const { week, daysUntilDue } = weekAndCountdown(dueDate, today);
  const notifications = [];

  const size = SIZE_MILESTONES[week];
  if (size) {
    notifications.push({
      id: `pregnancy-size-${week}`,
      icon: size.icon,
      title: `Week ${week} update`,
      message: size.message,
      actionLabel: "See this week",
      actionPath: "/pregnancy-dashboard",
    });
  }

  const persona = BABY_PERSONA[week];
  if (persona) {
    notifications.push({
      id: `pregnancy-persona-${week}`,
      icon: "🍼",
      title: "A note from baby",
      message: persona,
      actionLabel: "Open dashboard",
      actionPath: "/pregnancy-dashboard",
    });
  }

  const dow = today.getDay();
  if (dow === 6 || dow === 0) {
    notifications.push({
      id: `pregnancy-bump-photo-${stripTime(today)}`,
      icon: "📸",
      title: "Weekend check-in",
      message: "Time for the weekly bump photo! Grab your partner and snap a pic.",
      actionLabel: "Open dashboard",
      actionPath: "/pregnancy-dashboard",
    });
  }

  if (daysUntilDue > 0 && daysUntilDue <= 42) {
    notifications.push({
      id: "pregnancy-nesting-mode",
      icon: "🧳",
      title: `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"} left!`,
      message: "Have you packed the hospital bag yet?",
      actionLabel: "View calendar",
      actionPath: "/pregnancy-calendar",
    });
  }

  reminders.forEach((r) => {
    const rDate = new Date(r.date);
    const daysAway = Math.round((stripTime(rDate) - stripTime(today)) / MS_PER_DAY);
    if (daysAway < 0 || daysAway > 2) return;

    const when = daysAway === 0 ? "today" : daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;
    const isAppointment = r.type === "appointment";

    notifications.push({
      id: `pregnancy-reminder-${r._id}`,
      icon: isAppointment ? "🩺" : "🎉",
      title: r.title,
      message: `${isAppointment ? "You have a check-up" : "Coming up"} ${when}${
        r.time ? ` at ${r.time}` : ""
      }.${isAppointment ? " Make sure your questions list is ready!" : ""}`,
      actionLabel: "View calendar",
      actionPath: "/pregnancy-calendar",
    });
  });

  return notifications;
}