// Hardcoded demo data for Experiment 1 (UI only — MongoDB + Express land in Exp 4)
export const events = [
  {
    id: 'EVT-101',
    title: 'TechFest 2026',
    category: 'Technical',
    date: 'Sept 12, 2026',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    seatsTotal: 200,
    seatsLeft: 34,
    color: 'amber',
  },
  {
    id: 'EVT-102',
    title: 'Battle of Bands',
    category: 'Cultural',
    date: 'Sept 20, 2026',
    time: '5:00 PM',
    venue: 'Open Air Theatre',
    seatsTotal: 150,
    seatsLeft: 88,
    color: 'rust',
  },
  {
    id: 'EVT-103',
    title: 'Inter-College Hackathon',
    category: 'Technical',
    date: 'Oct 3, 2026',
    time: '9:00 AM',
    venue: 'CS Block Labs',
    seatsTotal: 100,
    seatsLeft: 6,
    color: 'ink',
  },
  {
    id: 'EVT-104',
    title: 'Sports Meet Finals',
    category: 'Sports',
    date: 'Oct 15, 2026',
    time: '4:00 PM',
    venue: 'College Ground',
    seatsTotal: 300,
    seatsLeft: 210,
    color: 'amber',
  },
]

export const myRegistrations = [
  { id: 'EVT-101', status: 'Confirmed', regNo: 'REG-58213' },
  { id: 'EVT-103', status: 'Waitlisted', regNo: 'REG-58214' },
]
