import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SetupAccount from "./pages/auth/SetupAccount";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { HierarchyProvider } from "./context/HierarchyContext";
import Roles from "./pages/admin/Roles";
import Users from "./pages/admin/Users";
import OrganizationList from "./pages/admin/OrganizationList";
import SectorList from "./pages/admin/SectorList";
import DepartmentList from "./pages/admin/DepartmentList";
import PermissionList from "./pages/admin/PermissionList";
import Teams from "./pages/admin/Teams";
import StructureGraph from "./pages/admin/StructureGraph";
import HierarchyManagement from "./pages/admin/HierarchyManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminLogs from "./pages/admin/AdminLogs";
import EmailLogs from "./pages/admin/EmailLogs";
import PortalContentPage from "./pages/admin/PortalContent";
import AlertSubscriptions from "./pages/admin/AlertSubscriptions";
import EmergencyContacts from "./pages/admin/EmergencyContacts";
import IncidentReports from "./pages/admin/IncidentReports";
import ConcernReports from "./pages/admin/ConcernReports";

// Template Engine
import TemplateLibrary from "./components/TemplateEngine/TemplateLibrary/TemplateLibrary";
import FormBuilder from "./components/TemplateEngine/FormBuilder/FormBuilder";

import UserProfiles from "./pages/UserProfiles";
import DisasterRiskAssessment from "./pages/DRM/DisasterRiskAssessment";
import DisasterRiskDatabase from "./pages/DRM/DisasterRiskDatabase";
import CommunityManagement from "./pages/DRM/CommunityManagement";
import EarlyWarning from "./pages/DRM/EarlyWarning";
import Volunteers from "./pages/DRM/Volunteers";
import Awareness from "./pages/DRM/Awareness";
import Inspection from "./pages/DRM/Inspection";
import Analytics from "./pages/DRM/Analytics";
import FormResponsePage from "./pages/DRM/FormResponsePage";
import ResponseExplorerPage from "./pages/DRM/ResponseExplorerPage";
import WoredaProfile from "./pages/DRM/WoredaProfile";
import WoredaProfileMap from "./pages/DRM/WoredaProfileMap";
import WoredaGeneralMap from "./pages/DRM/WoredaGeneralMap";
import MappingConfig from "./pages/DRM/MappingConfig";
import PublicFeedbackPage from "./pages/portal/PublicFeedbackPage";
import PublicServicePage from "./pages/portal/PublicServicePage";
import ServicePortalPage from "./pages/portal/ServicePortalPage";
import AlertSubscriptionPage from "./pages/portal/AlertSubscriptionPage";
import IncidentReportingPage from "./pages/portal/IncidentReportingPage";
import EmergencyContactDirectoryPage from "./pages/portal/EmergencyContactDirectoryPage";
import CommunityParticipationRegistrationPage from "./pages/portal/CommunityParticipationRegistrationPage";
import InspectionRequestPage from "./pages/portal/InspectionRequestPage";
import NotFound from "./pages/OtherPage/NotFound";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import LandingPage from "./pages/portal";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <>
      <AuthProvider>
        <HierarchyProvider>
          <Router>
            <ScrollToTop />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              theme="colored"
              className="!z-[9999999]"
            />
            <Routes>
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Form Response Page - Standalone (No Sidebar/Header) */}
                <Route path="/responses/:templateId" element={<FormResponsePage />} />
                <Route path="/woreda-profile/map" element={<WoredaProfileMap />} />
                <Route path="/woreda-profile/general-map" element={<WoredaGeneralMap />} />

                {/* Dashboard Layout Routes */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Home />} />
                  <Route path="/woreda-profile" element={<WoredaProfile />} />
                  <Route path="/woreda-profile/:section" element={<WoredaProfile />} />

                  {/* DRM Routes */}
                  <Route path="/disaster-risk-assessment" element={<DisasterRiskAssessment />} />
                  <Route path="/disaster-risk-database" element={<DisasterRiskDatabase />} />
                  <Route path="/community-management" element={<CommunityManagement />} />
                  <Route path="/early-warning" element={<EarlyWarning />} />
                  <Route path="/volunteers" element={<Volunteers />} />
                  <Route path="/awareness" element={<Awareness />} />
                  <Route path="/inspection" element={<Inspection />} />
                  <Route path="/analytics" element={<Analytics />} />

                  {/* Admin Routes */}
                  <Route path="/admin/organizations" element={<OrganizationList />} />
                  <Route path="/admin/sectors" element={<SectorList />} />
                  <Route path="/admin/departments" element={<DepartmentList />} />
                  <Route path="/admin/permissions" element={<PermissionList />} />
                  <Route path="/admin/roles" element={<Roles />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/teams" element={<Teams />} />
                  <Route path="/admin/structure-graph" element={<StructureGraph />} />
                  <Route path="/admin/hierarchy" element={<HierarchyManagement />} />
                  <Route path="/admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/admin/admin-logs" element={<AdminLogs />} />
                  <Route path="/admin/email-logs" element={<EmailLogs />} />
                  <Route path="/admin/site-settings" element={<PortalContentPage />} />
                  <Route path="/admin/alert-subscriptions" element={<AlertSubscriptions />} />
                  <Route path="/admin/emergency-contacts" element={<EmergencyContacts />} />
                  <Route path="/admin/incident-reports" element={<IncidentReports />} />
                  <Route path="/admin/concern-reports" element={<ConcernReports />} />
                  {/* Backward compatible */}
                  <Route path="/admin/portal-content" element={<PortalContentPage />} />

                  {/* Template Engine Routes */}
                  <Route path="/survey-library" element={<TemplateLibrary mode="published_only" />} />
                  <Route path="/admin/template-library" element={<TemplateLibrary mode="admin" />} />
                  <Route path="/admin/form-builder" element={<FormBuilder />} />
                  <Route path="/admin/form-builder/:id" element={<FormBuilder />} />
                  <Route path="/admin/profile-mapping" element={<MappingConfig />} />
                  <Route path="/admin/responses/:templateId" element={<ResponseExplorerPage />} />

                  {/* Others Page */}
                  <Route path="/profile" element={<UserProfiles />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/blank" element={<Blank />} />

                  {/* Forms */}
                  <Route path="/form-elements" element={<FormElements />} />

                  {/* Tables */}
                  <Route path="/basic-tables" element={<BasicTables />} />

                  {/* Ui Elements */}
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/avatars" element={<Avatars />} />
                  <Route path="/badge" element={<Badges />} />
                  <Route path="/buttons" element={<Buttons />} />
                  <Route path="/images" element={<Images />} />
                  <Route path="/videos" element={<Videos />} />

                  {/* Charts */}
                  <Route path="/line-chart" element={<LineChart />} />
                  <Route path="/bar-chart" element={<BarChart />} />
                </Route>
              </Route>

              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup-account" element={<SetupAccount />} />

              {/* Portal Landing Page */}
              <Route index path="/" element={<LandingPage />} />
              <Route path="/portal" element={<LandingPage />} />
              <Route path="/portal/services" element={<ServicePortalPage />} />
              <Route path="/feedback" element={<PublicFeedbackPage />} />
              <Route path="/portal/services/:serviceSlug" element={<PublicServicePage />} />
              <Route path="/alert-subscription" element={<AlertSubscriptionPage />} />
              <Route path="/incident-reporting" element={<IncidentReportingPage />} />
              <Route path="/emergency-contacts" element={<EmergencyContactDirectoryPage />} />
              <Route path="/community-registration" element={<CommunityParticipationRegistrationPage />} />
              <Route path="/inspection-request" element={<InspectionRequestPage />} />

              <Route path="/signin" element={<Login />} />
              <Route path="/signup" element={<Register />} />

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </HierarchyProvider>
      </AuthProvider >
    </>
  );
}
