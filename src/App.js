import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckDatabase from './pages/config/databasechek';
import LoginPage from './pages/commun/LoginPage';
import DatabaseForm from './pages/config/databaseconnection';
import ChefServiceDashboard from './pages/chef_service/Chef_serviceDashboard';
import DirecteurDashboard from './pages/directeur/DirecteurDashboard';
import SousDirecteurDashboard from './pages/sous_directeur/sous_directeurDashboard';
import EnregistrementDashboard from './pages/charger_d_enregistrement/enregistrement_dashboard';
import AuthService from './services/login_service';
import AddUserForm from './pages/directeur/usersadder';
import RemoveGestion from './pages/directeur/gestion';
import UsersList from './pages/commun/userstable';
import UserProfil from './pages/commun/userprofile';
import CreateOS from './pages/os/createOS';
import OSTable from './pages/os/ostable';
import OsView from './pages/os/OsView';
import CreateSousDirection from './pages/directeur/CreateSousDirection';
import ProtectedRoute from './components/ProtectedRoute';
import RaportDessai from './pages/os/RE/RaportDessai';
import FicheDessai from './pages/os/RE/FicheDessai';
import DocumentUploadPage from './pages/Personnaliser/Templates';
import Ficheessaidir from './pages/directeur/fichesdessai'


import Assign from './pages/chef_service/assign';
import OperateurHistorique from './pages/chef_service/operateur_historique'; 
import AssignsList from './pages/chef_service/assigns_list';
import FichesDesseisList from './pages/chef_service/fiches_esseis_list';
import ShowAssign from './pages/chef_service/show_assign';
import TestsList from './pages/chef_service/tests_list';
import Test from './pages/chef_service/test/test';
import TestSetCreation from './pages/chef_service/test/testsetcreation';
import Assigned from './pages/operator/assigned';
import AssignedList from './pages/operator/list_assigned';
import OperateurDashboard from './pages/operator/operateur_dashboard';
import FichesDessai from './pages/sous_directeur/fiches_dessai';

import './App.css';

function App() {
  const user = AuthService.getCurrentUser();
  return (
    <Router>
      <Routes>
        {/* Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/database-setup" element={<DatabaseForm />} />
        <Route path="/Directeur-dashboard" element={<ProtectedRoute user={user}><DirecteurDashboard /></ProtectedRoute>} />
        <Route path="/Enregistrement-Dashboard" element={<ProtectedRoute user={user}><EnregistrementDashboard /></ProtectedRoute>} />
        <Route path="/Chef_service-dashboard" element={<ProtectedRoute user={user}><ChefServiceDashboard /></ProtectedRoute>} />
        <Route path="/Sous_directeur-dashboard" element={<ProtectedRoute user={user}><SousDirecteurDashboard /></ProtectedRoute>} />
        <Route path="/ajoute-utilisateur" element={<AddUserForm />} />
        <Route path="/remove-gestion" element={<ProtectedRoute user={user}><RemoveGestion /></ProtectedRoute>} />
        <Route path="/list-utilisateurs" element={<ProtectedRoute user={user}><UsersList/></ProtectedRoute>} />
        <Route path="/utilisateur_profil/:userId" element={<ProtectedRoute user={user}><UserProfil /></ProtectedRoute>} />
        <Route path="/update-test" element={<ProtectedRoute user={user}><></></ProtectedRoute>} />
        <Route path="/list-OS" element={<ProtectedRoute user={user}><OSTable /></ProtectedRoute>} />
        <Route path="/create-os" element={<ProtectedRoute user={user}><CreateOS /></ProtectedRoute>} />
        <Route path="/os/:id" element={<ProtectedRoute user={user}><OsView /></ProtectedRoute>} />
        <Route path="/create-SousDirection" element={<ProtectedRoute user={user}><CreateSousDirection /></ProtectedRoute>} />
        <Route path="/raport-dessai/:id" element={<ProtectedRoute user={user}><RaportDessai /></ProtectedRoute>} />
        <Route path="/fiches-dessai" element={<ProtectedRoute user={user}><FichesDessai /></ProtectedRoute>} />
        <Route path="/fiches-dessai/tout" element={<ProtectedRoute user={user}><Ficheessaidir /></ProtectedRoute>} />
        <Route path="/fiche-dessai/:ficheDessaiId" element={<ProtectedRoute user={user}><FicheDessai /></ProtectedRoute>} />
        <Route path="/document-upload" element={<ProtectedRoute user={user}><DocumentUploadPage /></ProtectedRoute>} />

        <Route path="/assign/:esseiId" element={<ProtectedRoute user={user}><Assign/></ProtectedRoute>} />
        <Route path="/op-histo" element={<ProtectedRoute user={user}><OperateurHistorique /></ProtectedRoute>} />
        <Route path="/assigns-list" element={<ProtectedRoute user={user}><AssignsList /></ProtectedRoute>} />
        <Route path="/esseis-list" element={<ProtectedRoute user={user}><FichesDesseisList /></ProtectedRoute>} />
        <Route path="/show-assign/:id" element={<ProtectedRoute user={user}><ShowAssign /></ProtectedRoute>} />
        <Route path="/tests-list" element={<ProtectedRoute user={user}><TestsList /></ProtectedRoute>} />
        <Route path="/operateur/assigned/:assignId/:testId" element={<ProtectedRoute user={user}><Assigned /></ProtectedRoute>} />
        <Route path="/test/:id" element={<ProtectedRoute user={user}><Test /></ProtectedRoute>} />
        <Route path="/test-set/:id" element={<ProtectedRoute user={user}><TestSetCreation /></ProtectedRoute>} />
        <Route path="/oper-dashboard" element={<ProtectedRoute user={user}><OperateurDashboard /></ProtectedRoute>} />
        <Route path="/oper-assigned-list" element={<ProtectedRoute user={user}><AssignedList /></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
