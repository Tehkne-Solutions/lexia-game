// Basic FSRS (Free Spaced Repetition Scheduler) implementation for MVP
// Simplified version for demonstration

export interface Card {
    id: string;
    letter: string;
    difficulty: number; // 1-4
    stability: number; // days
    lastReview: Date;
    nextReview: Date;
}

export class FSRSScheduler {
    private cards: Card[] = [];

    addCard(letter: string): Card {
        const card: Card = {
            id: Math.random().toString(36).substr(2, 9),
            letter,
            difficulty: 2.5, // default
            stability: 1, // 1 day
            lastReview: new Date(),
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        };
        this.cards.push(card);
        return card;
    }

    reviewCard(cardId: string, rating: number): void {
        // rating: 1 (hard) to 4 (easy)
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        // Simple update based on rating
        const interval = Math.max(1, card.stability * (rating / 2));
        card.stability = interval;
        card.difficulty = Math.max(1, Math.min(4, card.difficulty + (4 - rating) * 0.1));
        card.lastReview = new Date();
        card.nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
    }

    getDueCards(): Card[] {
        const now = new Date();
        return this.cards.filter(card => card.nextReview <= now);
    }

    getAllCards(): Card[] {
        return this.cards;
    }
}