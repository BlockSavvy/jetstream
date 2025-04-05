'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { JetShareOffer, User } from '../utils/data-fetching';

type UiContextType = {
  // User dialogs
  userViewOpen: boolean;
  userEditOpen: boolean;
  userRoleOpen: boolean;
  userPasswordResetOpen: boolean;
  selectedUser: User | null;
  openUserView: (user: User) => void;
  openUserEdit: (user: User) => void;
  openUserRole: (user: User) => void;
  openUserPasswordReset: (user: User) => void;
  closeUserDialogs: () => void;
  
  // JetShare dialogs
  jetShareStatusOpen: boolean;
  selectedOffer: JetShareOffer | null;
  openJetShareStatus: (offer: JetShareOffer) => void;
  closeJetShareDialogs: () => void;
  
  // Refresh handlers
  refreshUsers: () => void;
  refreshOffers: () => void;
  setRefreshUsers: (callback: () => void) => void;
  setRefreshOffers: (callback: () => void) => void;
};

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  // User dialog states
  const [userViewOpen, setUserViewOpen] = useState(false);
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [userRoleOpen, setUserRoleOpen] = useState(false);
  const [userPasswordResetOpen, setUserPasswordResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // JetShare dialog states
  const [jetShareStatusOpen, setJetShareStatusOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<JetShareOffer | null>(null);
  
  // Refresh callbacks
  const [refreshUsersCallback, setRefreshUsersCallback] = useState<(() => void) | null>(null);
  const [refreshOffersCallback, setRefreshOffersCallback] = useState<(() => void) | null>(null);

  // User dialog handlers
  const openUserView = (user: User) => {
    setSelectedUser(user);
    setUserViewOpen(true);
  };
  
  const openUserEdit = (user: User) => {
    setSelectedUser(user);
    setUserEditOpen(true);
  };
  
  const openUserRole = (user: User) => {
    setSelectedUser(user);
    setUserRoleOpen(true);
  };
  
  const openUserPasswordReset = (user: User) => {
    setSelectedUser(user);
    setUserPasswordResetOpen(true);
  };
  
  const closeUserDialogs = () => {
    setUserViewOpen(false);
    setUserEditOpen(false);
    setUserRoleOpen(false);
    setUserPasswordResetOpen(false);
  };
  
  // JetShare dialog handlers
  const openJetShareStatus = (offer: JetShareOffer) => {
    setSelectedOffer(offer);
    setJetShareStatusOpen(true);
  };
  
  const closeJetShareDialogs = () => {
    setJetShareStatusOpen(false);
  };
  
  // Refresh handlers
  const refreshUsers = () => {
    if (refreshUsersCallback) refreshUsersCallback();
  };
  
  const refreshOffers = () => {
    if (refreshOffersCallback) refreshOffersCallback();
  };
  
  const setRefreshUsers = (callback: () => void) => {
    setRefreshUsersCallback(() => callback);
  };
  
  const setRefreshOffers = (callback: () => void) => {
    setRefreshOffersCallback(() => callback);
  };

  return (
    <UiContext.Provider
      value={{
        userViewOpen,
        userEditOpen,
        userRoleOpen,
        userPasswordResetOpen,
        selectedUser,
        openUserView,
        openUserEdit,
        openUserRole,
        openUserPasswordReset,
        closeUserDialogs,
        
        jetShareStatusOpen,
        selectedOffer,
        openJetShareStatus,
        closeJetShareDialogs,
        
        refreshUsers,
        refreshOffers,
        setRefreshUsers,
        setRefreshOffers
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (context === undefined) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
} 