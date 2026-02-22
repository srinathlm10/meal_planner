import React, { useState, useEffect } from 'react';
import { db } from '../firebaseClient';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch, query, where } from 'firebase/firestore';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

// Major Indian festivals for 2026 (Hardcoded)
const HOLIDAYS_2026 = {
    '2026-01-01': 'New Year\'s Day',
    '2026-01-14': 'Makar Sankranti / Pongal',
    '2026-01-26': 'Republic Day',
    '2026-02-15': 'Maha Shivaratri',
    '2026-03-04': 'Holi',
    '2026-03-19': 'Ugadi / Gudi Padwa',
    '2026-03-26': 'Ram Navami',
    '2026-03-30': 'Eid al-Fitr',
    '2026-03-31': 'Mahavir Jayanti',
    '2026-04-03': 'Good Friday',
    '2026-04-14': 'Tamil New Year / Ambedkar Jayanti',
    '2026-05-01': 'Buddha Purnima',
    '2026-05-27': 'Eid al-Adha (Bakrid)',
    '2026-06-26': 'Muharram',
    '2026-08-15': 'Independence Day',
    '2026-08-28': 'Raksha Bandhan',
    '2026-09-04': 'Janmashtami',
    '2026-09-14': 'Ganesh Chaturthi',
    '2026-10-02': 'Gandhi Jayanti',
    '2026-10-10': 'Navratri Starts',
    '2026-10-20': 'Dussehra / Vijayadashami',
    '2026-11-08': 'Diwali',
    '2026-11-24': 'Guru Nanak Jayanti',
    '2026-12-25': 'Christmas'
};

const Dashboard = () => {
    // State for Input Form
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputs, setInputs] = useState({ Breakfast: '', Lunch: '', Dinner: '', Note: '' });
    const [loading, setLoading] = useState(false);

    // State for Weekly Table
    const [weeklyMeals, setWeeklyMeals] = useState({}); // { "YYYY-MM-DD": { Breakfast: "...", Note: "..." } }
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const [visitCount, setVisitCount] = useState(0);

    // Helper: Get Monday of the provided date
    function getMonday(d) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    // Helper: Get the 7 days (Mon-Sun) based on weekStart
    const getWeekDays = (startDate) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    // --- Visit Counter Logic ---
    useEffect(() => {
        const updateVisitCount = async () => {
            try {
                // 1. Get current count
                const docRef = doc(db, 'site_stats', 'status');
                const docSnap = await getDoc(docRef);

                let newCount = 1;
                if (docSnap.exists()) {
                    newCount = docSnap.data().visits + 1;
                    // 2. Increment
                    await updateDoc(docRef, { visits: newCount });
                } else {
                    // Initialize if not exists
                    await setDoc(docRef, { visits: 1 });
                }
                setVisitCount(newCount);
            } catch (err) {
                console.warn("Could not fetch visit count.", err);
            }
        };
        updateVisitCount();
    }, []);

    const fetchWeeklyMeals = async () => {
        setLoading(true);
        const dates = getWeekDays(weekStart);
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        const mapping = {};

        // 1. Populate with Default Holidays
        dates.forEach(date => {
            if (HOLIDAYS_2026[date]) {
                if (!mapping[date]) mapping[date] = {};
                mapping[date]['Note'] = HOLIDAYS_2026[date];
            }
        });

        try {
            // Fetch Meals
            const mealsRef = collection(db, 'meals');
            const mealsQuery = query(mealsRef, where('member_id', '==', 'Family'), where('date', '>=', startDate), where('date', '<=', endDate));
            const mealsSnap = await getDocs(mealsQuery);

            mealsSnap.forEach(docSnap => {
                const m = docSnap.data();
                if (!mapping[m.date]) mapping[m.date] = {};
                mapping[m.date][m.meal_type] = m.description;
            });
        } catch (mealsError) {
            console.error('Error fetching meals:', mealsError);
        }

        try {
            // Fetch Events
            const eventsRef = collection(db, 'events');
            const eventsQuery = query(eventsRef, where('date', '>=', startDate), where('date', '<=', endDate));
            const eventsSnap = await getDocs(eventsQuery);

            eventsSnap.forEach(docSnap => {
                const e = docSnap.data();
                if (!mapping[e.date]) mapping[e.date] = {};
                if (e.note) mapping[e.date]['Note'] = e.note;
            });
        } catch (e) {
            console.warn('Events table might not exist yet.', e);
        }

        setWeeklyMeals(mapping);
        setLoading(false);
    };

    useEffect(() => {
        fetchWeeklyMeals();
    }, [weekStart]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const batch = writeBatch(db);

            // 1. Upsert Meals
            MEAL_TYPES.forEach(type => {
                // Using a composite ID for simplicity: memberId_date_mealType
                const mealId = `Family_${selectedDate}_${type}`;
                const mealRef = doc(db, 'meals', mealId);
                batch.set(mealRef, {
                    member_id: 'Family',
                    date: selectedDate,
                    meal_type: type,
                    description: inputs[type] || ''
                }, { merge: true }); // equivalent to upsert
            });

            // 2. Upsert Event/Note
            if (inputs.Note !== undefined) {
                const eventRef = doc(db, 'events', selectedDate); // ID is just the date
                if (inputs.Note.trim() === '') {
                    // Optional: could delete the document if note is empty
                    batch.set(eventRef, { date: selectedDate, note: '' }, { merge: true });
                } else {
                    batch.set(eventRef, { date: selectedDate, note: inputs.Note }, { merge: true });
                }
            }

            await batch.commit();

        } catch (err) {
            console.error('Failed to save data:', err);
            alert("Failed to save data. Error: " + err.message);
        }

        // Refresh
        await fetchWeeklyMeals();
        setLoading(false);
    };

    const copyLastWeek = async () => {
        if (!confirm("Are you sure you want to copy the ENTIRE menu from last week to this week? This will overwrite current meals.")) return;

        setLoading(true);

        // 1. Calculate Previous Week Dates
        const prevStart = new Date(weekStart);
        prevStart.setDate(prevStart.getDate() - 7);
        const prevDates = getWeekDays(prevStart);
        const prevStartDate = prevDates[0];
        const prevEndDate = prevDates[6];

        try {
            // 2. Fetch Previous Week Meals
            const mealsRef = collection(db, 'meals');
            const prevMealsQuery = query(mealsRef, where('member_id', '==', 'Family'), where('date', '>=', prevStartDate), where('date', '<=', prevEndDate));
            const prevMealsSnap = await getDocs(prevMealsQuery);

            if (prevMealsSnap.empty) {
                alert("No meals found in last week to copy.");
                setLoading(false);
                return;
            }

            // 3. Prepare New Meals (Shift date by +7 days)
            const batch = writeBatch(db);

            prevMealsSnap.forEach(docSnap => {
                const m = docSnap.data();
                const d = new Date(m.date);
                d.setDate(d.getDate() + 7);
                const newDateStr = d.toISOString().split('T')[0];

                const newMealId = `Family_${newDateStr}_${m.meal_type}`;
                const newMealRef = doc(db, 'meals', newMealId);

                batch.set(newMealRef, {
                    member_id: 'Family',
                    date: newDateStr,
                    meal_type: m.meal_type,
                    description: m.description
                }, { merge: true });
            });

            // 4. Commit Writes
            await batch.commit();

            // Refresh
            await fetchWeeklyMeals();
        } catch (error) {
            alert("Error copying menu.");
            console.error(error);
        }

        setLoading(false);
    };

    const loadDayIntoInput = (date) => {
        setSelectedDate(date);
        const dayData = weeklyMeals[date] || {};
        setInputs({
            Breakfast: dayData.Breakfast || '',
            Lunch: dayData.Lunch || '',
            Dinner: dayData.Dinner || '',
            Note: dayData.Note || '' // This will load holiday if present and not overridden
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const changeWeek = (offset) => {
        const newStart = new Date(weekStart);
        newStart.setDate(newStart.getDate() + (offset * 7));
        setWeekStart(newStart);
    };

    const weekDays = getWeekDays(weekStart);

    return (
        <div className="dashboard fade-in">
            {/* --- Top Section: Input Form --- */}
            <div className="card input-section">
                <div className="section-header">
                    <h3>Plan Your Meals</h3>
                    <span className="subtitle">Edit details for the selected day</span>
                </div>
                <form onSubmit={handleSave}>
                    <div className="form-group date-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="inputs-grid">
                        {MEAL_TYPES.map(type => (
                            <div key={type} className="form-group">
                                <label>{type}</label>
                                <input
                                    type="text"
                                    placeholder={`Enter ${type}...`}
                                    value={inputs[type]}
                                    onChange={(e) => setInputs(prev => ({ ...prev, [type]: e.target.value }))}
                                />
                            </div>
                        ))}
                        {/* Special Note Input */}
                        <div className="form-group special-group">
                            <label className="special-label">✨ Special Event / Note</label>
                            <input
                                type="text"
                                placeholder="e.g. Festival, Birthday..."
                                value={inputs.Note}
                                className="special-input"
                                onChange={(e) => setInputs(prev => ({ ...prev, Note: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Bottom Section: Fixed Weekly Table --- */}
            <div className="card table-section">
                <div className="table-header">
                    <h3>Weekly View</h3>
                    <div className="week-controls">
                        <button className="btn btn-secondary btn-sm" onClick={copyLastWeek} disabled={loading} title="Copy meals from last week">
                            📋 Copy Last Week
                        </button>
                    </div>
                    <div className="week-nav">
                        <button className="btn btn-secondary btn-sm" onClick={() => changeWeek(-1)}>← Last Week</button>
                        <span className="current-week-label">
                            {weekDays[0]} — {weekDays[6]}
                        </span>
                        <button className="btn btn-secondary btn-sm" onClick={() => changeWeek(1)}>Next Week →</button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Breakfast</th>
                                <th>Lunch</th>
                                <th>Dinner</th>
                                <th>Special Event</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weekDays.map(date => {
                                const dayData = weeklyMeals[date] || {};
                                const dateObj = new Date(date);
                                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const isToday = date === new Date().toISOString().split('T')[0];
                                const hasEvent = !!dayData.Note;

                                return (
                                    <tr key={date} className={isToday ? 'row-today' : ''}>
                                        <td>
                                            <div className="date-cell">
                                                <span className="day-name">{dayName}</span>
                                                <span className="date-text">{formattedDate}</span>
                                            </div>
                                        </td>
                                        <td>{dayData.Breakfast || '-'}</td>
                                        <td>{dayData.Lunch || '-'}</td>
                                        <td>{dayData.Dinner || '-'}</td>
                                        <td>
                                            {hasEvent ? (
                                                <span className="event-tag">✨ {dayData.Note}</span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => loadDayIntoInput(date)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visit Counter (Simple Number) */}
            <div className="visit-counter-container">
                <span className="visit-number">{visitCount}</span>
            </div>

            <style>{`
                .visit-counter-container {
                    text-align: right;
                    padding: 0 var(--spacing-md);
                    margin-top: -1rem; /* Pull closer to table */
                    margin-bottom: 2rem;
                }

                .visit-number {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    opacity: 0.7;
                }

                .input-section {
                    border-top: 4px solid var(--accent-primary);
                }
                
                .section-header {
                    margin-bottom: var(--spacing-md);
                }

                .subtitle {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }

                .inputs-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--spacing-md);
                    margin-bottom: var(--spacing-lg);
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.4rem;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }

                .special-label {
                    color: var(--accent-highlight) !important;
                }
                
                .special-input {
                    border-color: var(--accent-highlight) !important;
                    background: rgba(219, 39, 119, 0.05) !important;
                }

                .actions {
                    display: flex;
                    justify-content: flex-end;
                    padding-top: var(--spacing-md);
                    border-top: 1px solid var(--border-color);
                }

                /* Table Section */
                .table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-md);
                    flex-wrap: wrap;
                    gap: var(--spacing-md);
                }

                .week-controls {
                    display: flex;
                    gap: var(--spacing-sm);
                }

                .week-nav {
                    display: flex;
                    gap: var(--spacing-sm);
                    align-items: center;
                    padding: 0.25rem;
                    border-radius: var(--radius-md);
                }
                
                .current-week-label {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    padding: 0 var(--spacing-sm);
                    white-space: nowrap;
                }

                .table-responsive {
                    overflow-x: auto;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-color);
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 750px; /* Increased min-width for extra column */
                }

                th {
                    text-align: left;
                    padding: 1rem;
                    background: var(--bg-input); 
                    color: var(--text-muted);
                    font-weight: 600;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                }

                td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    vertical-align: top;
                }

                tr:last-child td {
                    border-bottom: none;
                }

                .row-today {
                     background: rgba(14, 165, 233, 0.1); 
                }

                .date-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .day-name {
                    font-weight: 700;
                    color: var(--accent-primary);
                }

                .date-text {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }

                .event-tag {
                    display: inline-block;
                    font-size: 0.85rem;
                    color: #be185d;
                    background: #fce7f3;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .inputs-grid {
                        grid-template-columns: 1fr;
                    }
                    .table-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .week-controls, .week-nav {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
