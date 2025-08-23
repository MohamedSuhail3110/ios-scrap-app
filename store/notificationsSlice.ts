import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppNotificationType = 'order' | 'message' | 'review' | 'delivery' | 'system';

export interface AppNotification {
	id: string;
	title: string;
	message: string;
	time: string;
	type: AppNotificationType;
	read: boolean;
}

interface NotificationsState {
	items: AppNotification[];
}

const initialState: NotificationsState = {
	items: []
};

const notificationsSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		addNotificationIfNotExists: (state, action: PayloadAction<AppNotification>) => {
			const incoming = action.payload;
			const exists = state.items.some(n => n.id === incoming.id);
			if (!exists) {
				state.items.unshift(incoming);
			}
		},
		markAsRead: (state, action: PayloadAction<string>) => {
			state.items = state.items.map(n => n.id === action.payload ? { ...n, read: true } : n);
		},
		markAllAsRead: (state) => {
			state.items = state.items.map(n => ({ ...n, read: true }));
		},
		clearNotifications: (state) => {
			state.items = [];
		}
	}
});

export const {
	addNotificationIfNotExists,
	markAsRead,
	markAllAsRead,
	clearNotifications
} = notificationsSlice.actions;

export default notificationsSlice.reducer;


