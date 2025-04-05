'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { JetShareOffer, User, Flight } from '../utils/data-fetching';

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
  jetShareViewOpen: boolean;
  jetShareCreateOpen: boolean;
  jetShareDeleteOpen: boolean;
  selectedOffer: JetShareOffer | null;
  openJetShareStatus: (offer: JetShareOffer) => void;
  openJetShareView: (offer: JetShareOffer) => void;
  openJetShareCreate: () => void;
  openJetShareDelete: (offer: JetShareOffer) => void;
  closeJetShareDialogs: () => void;
  
  // Flight dialogs
  flightViewOpen: boolean;
  flightCreateOpen: boolean;
  selectedFlight: Flight | null;
  openFlightView: (flight: Flight) => void;
  openFlightCreate: () => void;
  closeFlightDialogs: () => void;
  
  // Refresh handlers
  refreshUsers: () => void;
  refreshOffers: () => void;
  refreshFlights: () => void;
  setRefreshUsers: (callback: () => void) => void;
  setRefreshOffers: (callback: () => void) => void;
  setRefreshFlights: (callback: () => void) => void;
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
  const [jetShareViewOpen, setJetShareViewOpen] = useState(false);
  const [jetShareCreateOpen, setJetShareCreateOpen] = useState(false);
  const [jetShareDeleteOpen, setJetShareDeleteOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<JetShareOffer | null>(null);
  
  // Flight dialog states
  const [flightViewOpen, setFlightViewOpen] = useState(false);
  const [flightCreateOpen, setFlightCreateOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  
  // Refresh callbacks
  const [refreshUsersCallback, setRefreshUsersCallback] = useState<(() => void) | null>(null);
  const [refreshOffersCallback, setRefreshOffersCallback] = useState<(() => void) | null>(null);
  const [refreshFlightsCallback, setRefreshFlightsCallback] = useState<(() => void) | null>(null);

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
  
  const openJetShareView = (offer: JetShareOffer) => {
    setSelectedOffer(offer);
    setJetShareViewOpen(true);
  };
  
  const openJetShareCreate = () => {
    setSelectedOffer(null);
    setJetShareCreateOpen(true);
  };
  
  const openJetShareDelete = (offer: JetShareOffer) => {
    setSelectedOffer(offer);
    setJetShareDeleteOpen(true);
  };
  
  const closeJetShareDialogs = () => {
    setJetShareStatusOpen(false);
    setJetShareViewOpen(false);
    setJetShareCreateOpen(false);
    setJetShareDeleteOpen(false);
  };
  
  // Flight dialog handlers
  const openFlightView = (flight: Flight) => {
    setSelectedFlight(flight);
    setFlightViewOpen(true);
  };
  
  const openFlightCreate = () => {
    setSelectedFlight(null);
    setFlightCreateOpen(true);
  };
  
  const closeFlightDialogs = () => {
    setFlightViewOpen(false);
    setFlightCreateOpen(false);
  };
  
  // Refresh handlers
  const refreshUsers = () => {
    if (refreshUsersCallback) refreshUsersCallback();
  };
  
  const refreshOffers = () => {
    if (refreshOffersCallback) refreshOffersCallback();
  };
  
  const refreshFlights = () => {
    if (refreshFlightsCallback) refreshFlightsCallback();
  };
  
  const setRefreshUsers = (callback: () => void) => {
    setRefreshUsersCallback(() => callback);
  };
  
  const setRefreshOffers = (callback: () => void) => {
    setRefreshOffersCallback(() => callback);
  };
  
  const setRefreshFlights = (callback: () => void) => {
    setRefreshFlightsCallback(() => callback);
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
        jetShareViewOpen,
        jetShareCreateOpen,
        jetShareDeleteOpen,
        selectedOffer,
        openJetShareStatus,
        openJetShareView,
        openJetShareCreate,
        openJetShareDelete,
        closeJetShareDialogs,
        
        flightViewOpen,
        flightCreateOpen,
        selectedFlight,
        openFlightView,
        openFlightCreate,
        closeFlightDialogs,
        
        refreshUsers,
        refreshOffers,
        refreshFlights,
        setRefreshUsers,
        setRefreshOffers,
        setRefreshFlights
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