import { nanoid } from 'nanoid';
import { createNanoEvents, type Unsubscribe } from 'nanoevents';
import type { User } from '../model/User';
import type { PresentUser } from './PresentUser';
import type { PresenceEvents } from './PresenceEvents';
import { createDefaultAppearanceProvider } from './AppearanceProvider';
import type { AppearanceProvider } from './AppearanceProvider';

export interface PresenceState {

  // Get users currently present to this room
  getPresentUsers(): PresentUser[];

  // Notify of a given present user's activity on the given annotations
  notifyActivity(presenceKey: string, annotationIds: string[]): void;

  // Add a listener for the given presence event
  on<E extends keyof PresenceEvents>(event: E, callback: PresenceEvents[E]): Unsubscribe;

  // Initial sync - which users are present under which keys
  syncUsers(state: { presenceKey: string, user: User }[]): void;

  // Update the selection state for the given prresent user
  updateSelection(presenceKey: string, selection: string[] | null): void;

}

const isListEqual = (listA: any[], listB: any[]) => 
  listA.every(a => listA.includes(a)) && listB.every(b => listA.includes(b));

// This client's presence key
export const PRESENCE_KEY = nanoid();

export const createPresenceState = (
  appearanceProvider: AppearanceProvider = createDefaultAppearanceProvider()
): PresenceState => {

  const emitter = createNanoEvents<PresenceEvents>();

  const presentUsers = new Map<string, PresentUser>();

  const selectionStates = new Map<string, string[]>();

  const addUser = (presenceKey: string, user: User) => {
    if (presentUsers.has(presenceKey)) {
      console.warn('Attempt to add user that is already present', presenceKey, user);
      return;    
    }

    const appearance = appearanceProvider.addUser(presenceKey, user);

    presentUsers.set(presenceKey, { 
      ...user,
      presenceKey,
      appearance
    });
  }

  const removeUser = (presenceKey: string) => {
    const user = presentUsers.get(presenceKey);
    if (!user) {
      console.warn('Attempt to remove user that is not present', presenceKey);
      return;
    }

    appearanceProvider.removeUser(user);

    presentUsers.delete(presenceKey);
  }

  const syncUsers = (state: { presenceKey: string, user: User }[]) => {
    // const keys = new Set(others.map(s => s.presenceKey));
    const keys = new Set(state.map(s => s.presenceKey));

    // These users need to be added to the presentUsers list
    // const toAdd = others.filter(({ presenceKey }) => !presentUsers.has(presenceKey));
    const toAdd = state.filter(({ presenceKey }) => !presentUsers.has(presenceKey));

    // These users need to be dropped from the list
    const toRemove = Array.from(presentUsers.values()).filter(presentUser =>
      !keys.has(presentUser.presenceKey));

    toAdd.forEach(({ presenceKey, user }) => addUser(presenceKey, user));

    toRemove.forEach(user => {
      const { presenceKey } = user;

      // If this user has a selection, fire deselect event
      if (selectionStates.has(presenceKey))
        emitter.emit('selectionChange', user, null);

      removeUser(presenceKey)
    });

    if (toAdd.length > 0 || toRemove.length > 0)
      emitter.emit('presence', getPresentUsers());
  }

  const notifyActivity = (presenceKey: string, annotationIds: string[]) => {    
    const user = presentUsers.get(presenceKey);
    
    if (!user) {
      console.warn('Activity notification from user that is not present');
      return;
    }

    const currentSelection = selectionStates.get(presenceKey);

    // Was there a selection change we might have missed?
    if (!currentSelection || !isListEqual(currentSelection, annotationIds)) {
      selectionStates.set(presenceKey, annotationIds);
      emitter.emit('selectionChange', user, annotationIds);
    }
  }

  const updateSelection = (presenceKey: string, selection: string[] | null) => {
    const from = presentUsers.get(presenceKey);
    if (!from) {
      console.warn('Selection change for user that is not present', presenceKey);
      return;
    }

    if (selection)
      selectionStates.set(presenceKey, selection);
    else 
      selectionStates.delete(presenceKey);

    emitter.emit('selectionChange', from, selection);
  }

  const getPresentUsers = () =>
    [...Array.from(presentUsers.values())];
    
  const on = <E extends keyof PresenceEvents>(event: E, callback: PresenceEvents[E]) =>
    emitter.on(event, callback);

  return {
    getPresentUsers,
    notifyActivity,
    on,
    syncUsers,
    updateSelection
  }

}