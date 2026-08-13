import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute/ProtectedRoute';

import Login                 from '../pages/auth/Login';
import Register              from '../pages/auth/Register';
import UserHome              from '../pages/user/UserHome';
import CultureExplorer       from '../pages/user/CultureExplorer';
import CeremonyDetail        from '../pages/user/CeremonyDetail';
import LineageExplorer       from '../pages/user/LineageExplorer';
import CulturalChat          from '../pages/user/CulturalChat';
import CinemaListing         from '../pages/user/CinemaListing';
import CinemaRoom            from '../pages/user/CinemaRoom';
import Seminars              from '../pages/user/Seminars';
import MyBookings            from '../pages/user/MyBookings';
import Marketplace           from '../pages/user/Marketplace';
import ImvunuloCatalogue     from '../pages/user/ImvunuloCatalogue';
import Tourism               from '../pages/user/Tourism';
import Library               from '../pages/user/Library';
import MyEnquiries           from '../pages/user/MyEnquiries';
import PractitionerOverview  from '../pages/practitioner/PractitionerOverview';
import LineageRecords        from '../pages/practitioner/history/LineageRecords';
import LineageFormPage       from '../pages/practitioner/history/LineageFormPage';
import ClansManager          from '../pages/practitioner/history/ClansManager';
import Ceremonies            from '../pages/practitioner/ceremony/Ceremonies';
import CeremonyFormPage      from '../pages/practitioner/ceremony/CeremonyFormPage';
import WalkthroughManager    from '../pages/practitioner/ceremony/WalkthroughManager';
import SongsLibrary          from '../pages/practitioner/ceremony/SongsLibrary';
import Services              from '../pages/practitioner/services/Services';
import Seminars_Practitioner from '../pages/practitioner/seminar/Seminars';
import SeminarFormPage       from '../pages/practitioner/seminar/SeminarFormPage';
import Imvunulo_Practitioner from '../pages/practitioner/imvunulo/Imvunulo';
import ImvunuloFormPage      from '../pages/practitioner/imvunulo/ImvunuloFormPage';
import Publications           from '../pages/practitioner/library/Publications';
import PublicationFormPage    from '../pages/practitioner/library/PublicationFormPage';
import Notifications         from '../pages/practitioner/shared/Notifications';
import ProfileSettings       from '../pages/practitioner/shared/ProfileSettings';
import Help                  from '../pages/practitioner/shared/Help';
import AdminOverview         from '../pages/admin/AdminOverview';
import UserManagement        from '../pages/admin/UserManagement';
import ContentReview         from '../pages/admin/ContentReview';
import PublishedContent      from '../pages/admin/PublishedContent';
import CinemaManagement      from '../pages/admin/CinemaManagement';
import SystemConfig          from '../pages/admin/SystemConfig';
import Analytics             from '../pages/admin/Analytics';
import AuditLog              from '../pages/admin/AuditLog';
import ModelTraining         from '../pages/admin/ModelTraining';
import Ratings               from '../pages/admin/Ratings';
import TourismManagement     from '../pages/admin/TourismManagement';
import UserLayout            from '../components/layout/UserLayout/UserLayout';
import PractitionerLayout    from '../components/layout/PractitionerLayout/PractitionerLayout';
import AdminLayout           from '../components/layout/AdminLayout/AdminLayout';

const PR = ['history_keeper', 'ceremony_keeper'];

const AppRouter = () => (
  <Routes>
    <Route path="/login"         element={<Login />} />
    <Route path="/register"      element={<Register />} />
    <Route path="/unauthorized"  element={<div className="p-8 text-center text-gray-600">Access denied.</div>} />

    <Route element={<UserLayout />}>
      <Route path="/"                          element={<UserHome />} />
      <Route path="/explore"                   element={<CultureExplorer />} />
      <Route path="/explore/ceremonies/:id"    element={<CeremonyDetail />} />
      <Route path="/explore/lineage"           element={<LineageExplorer />} />
      <Route path="/marketplace"               element={<Marketplace />} />
      <Route path="/imvunulo"                  element={<ImvunuloCatalogue />} />
      <Route path="/tourism"                   element={<Tourism />} />
      <Route path="/library"                   element={<Library />} />
      <Route path="/cinema"                    element={<CinemaListing />} />
      <Route path="/seminars"                  element={<Seminars />} />
      <Route path="/help"                      element={<Help />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<UserLayout />}>
        <Route path="/chat"           element={<CulturalChat />} />
        <Route path="/cinema/:id"     element={<CinemaRoom />} />
        <Route path="/my-bookings"    element={<MyBookings />} />
        <Route path="/my-enquiries"   element={<MyEnquiries />} />
        <Route path="/profile"        element={<ProfileSettings />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={PR} />}>
      <Route element={<PractitionerLayout />}>
        <Route path="/practitioner"                        element={<PractitionerOverview />} />
        <Route path="/practitioner/notifications"          element={<Notifications />} />
        <Route path="/practitioner/lineage"                element={<LineageRecords />} />
        <Route path="/practitioner/lineage/new"            element={<LineageFormPage />} />
        <Route path="/practitioner/lineage/:id/edit"       element={<LineageFormPage />} />
        <Route path="/practitioner/clans"                  element={<ClansManager />} />
        <Route path="/practitioner/ceremonies"                    element={<Ceremonies />} />
        <Route path="/practitioner/ceremonies/new"             element={<CeremonyFormPage />} />
        <Route path="/practitioner/ceremonies/:id/edit"        element={<CeremonyFormPage />} />
        <Route path="/practitioner/ceremonies/:id/walkthrough" element={<WalkthroughManager />} />
        <Route path="/practitioner/songs"                      element={<SongsLibrary />} />
        <Route path="/practitioner/services"                   element={<Services />} />
        <Route path="/practitioner/seminars"                   element={<Seminars_Practitioner />} />
        <Route path="/practitioner/seminars/new"               element={<SeminarFormPage />} />
        <Route path="/practitioner/seminars/:id/edit"          element={<SeminarFormPage />} />
        <Route path="/practitioner/imvunulo"                   element={<Imvunulo_Practitioner />} />
        <Route path="/practitioner/imvunulo/new"               element={<ImvunuloFormPage />} />
        <Route path="/practitioner/imvunulo/:id/edit"          element={<ImvunuloFormPage />} />
        <Route path="/practitioner/library"                    element={<Publications />} />
        <Route path="/practitioner/library/new"                element={<PublicationFormPage />} />
        <Route path="/practitioner/library/:id/edit"           element={<PublicationFormPage />} />
        <Route path="/practitioner/profile"                    element={<ProfileSettings />} />
        <Route path="/practitioner/help"                       element={<Help />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={['admin']} />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin"              element={<AdminOverview />} />
        <Route path="/admin/users"        element={<UserManagement />} />
        <Route path="/admin/review"       element={<ContentReview />} />
        <Route path="/admin/content"      element={<PublishedContent />} />
        <Route path="/admin/cinema"       element={<CinemaManagement />} />
        <Route path="/admin/tourism"      element={<TourismManagement />} />
        <Route path="/admin/config"       element={<SystemConfig />} />
        <Route path="/admin/analytics"    element={<Analytics />} />
        <Route path="/admin/ratings"      element={<Ratings />} />
        <Route path="/admin/audit"        element={<AuditLog />} />
        <Route path="/admin/model"        element={<ModelTraining />} />
        <Route path="/admin/help"         element={<Help />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRouter;
