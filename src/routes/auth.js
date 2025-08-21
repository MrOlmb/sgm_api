const express = require('express');
const authController = require('../controllers/auth.controller');
const { authentifierJWT, verifierChangementMotPasse } = require('../middleware/auth-local');
const { loginLimiter } = require('../middleware/security');

const router = express.Router();

/**
 * @swagger
 * /api/auth/connexion:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Authentification avec nom d'utilisateur et mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             president:
 *               summary: Connexion Président
 *               value:
 *                 nom_utilisateur: "president.sgm"
 *                 mot_passe: "MotPasse123!"
 *             secretary:
 *               summary: Connexion Secrétaire
 *               value:
 *                 nom_utilisateur: "secrétaire.sgm"
 *                 mot_passe: "MotPasse123!"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/connexion', loginLimiter, authController.seConnecter);

/**
 * @swagger
 * /api/auth/change-temporary-password:
 *   post:
 *     summary: 🔑 Changer mot de passe temporaire (première connexion)
 *     description: |
 *       Permet aux nouveaux utilisateurs de changer leur mot de passe temporaire
 *       lors de leur première connexion. Peut aussi ajouter un email optionnel.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nouveau_mot_passe]
 *             properties:
 *               nouveau_mot_passe:
 *                 type: string
 *                 minLength: 8
 *                 description: Nouveau mot de passe fort (8+ caractères, majuscules, minuscules, chiffres, caractères spéciaux)
 *                 example: "NouveauMotPasse123!"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email optionnel pour récupération de mot de passe
 *                 example: "utilisateur@example.com"
 *     responses:
 *       200:
 *         description: Mot de passe temporaire changé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe changé avec succès"
 *                 email_ajoute:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Non autorisé (déjà changé ou pas de mot de passe temporaire)
 */
router.post('/change-temporary-password', authentifierJWT, authController.changerMotPasseTemporaire);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: 🔄 Changer mot de passe (tous utilisateurs)
 *     description: |
 *       Permet à tous les utilisateurs authentifiés de changer leur mot de passe.
 *       Nécessite l'ancien mot de passe pour validation.
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ancien_mot_passe, nouveau_mot_passe]
 *             properties:
 *               ancien_mot_passe:
 *                 type: string
 *                 example: "AncienMotPasse123!"
 *               nouveau_mot_passe:
 *                 type: string
 *                 minLength: 8
 *                 example: "NouveauMotPasse123!"
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Ancien mot de passe incorrect
 */
router.post('/change-password', authentifierJWT, authController.changerMotPasse);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: 📧 Réinitialiser mot de passe via email (tous utilisateurs)
 *     description: |
 *       Permet à tous les utilisateurs de réinitialiser leur mot de passe en recevant
 *       un lien de vérification par email. Fonctionne avec email ou nom d'utilisateur.
 *       
 *       **Fonctionnalités:**
 *       - Recherche par email ou nom d'utilisateur
 *       - Envoi automatique d'email avec lien sécurisé
 *       - Lien expire après 1 heure
 *       - Erreur claire si aucun email n'est associé au compte
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email associé au compte
 *                 example: "utilisateur@example.com"
 *               nom_utilisateur:
 *                 type: string
 *                 description: Nom d'utilisateur (alternative à email)
 *                 example: "jean.membre"
 *             oneOf:
 *               - required: [email]
 *               - required: [nom_utilisateur]
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Un email de réinitialisation a été envoyé à votre adresse"
 *                 email_masque:
 *                   type: string
 *                   example: "ut***@example.com"
 *                 email_envoye:
 *                   type: boolean
 *                   example: true
 *                 expiration:
 *                   type: string
 *                   example: "1 heure"
 *       400:
 *         description: Email manquant sur le compte
 *       404:
 *         description: Utilisateur non trouvé
 *       403:
 *         description: Compte désactivé
 */
router.post('/reset-password', loginLimiter, authController.reinitialiserMotPasse);

/**
 * @swagger
 * /api/auth/verify-reset:
 *   post:
 *     summary: ✅ Confirmer réinitialisation avec token email
 *     description: |
 *       Finalise la réinitialisation de mot de passe en utilisant le token
 *       reçu par email. Le nouveau mot de passe remplace l'ancien.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, nouveau_mot_passe]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token reçu par email
 *                 example: "a1b2c3d4e5f6..."
 *               nouveau_mot_passe:
 *                 type: string
 *                 minLength: 8
 *                 description: Nouveau mot de passe fort
 *                 example: "NouveauMotPasse123!"
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe réinitialisé avec succès"
 *                 utilisateur:
 *                   type: object
 *                   properties:
 *                     nom_complet:
 *                       type: string
 *                       example: "Jean Claude MBONGO"
 *                     nom_utilisateur:
 *                       type: string
 *                       example: "jean.membre"
 *       400:
 *         description: Token invalide/expiré ou mot de passe invalide
 *       403:
 *         description: Compte désactivé
 */
router.post('/verify-reset', authController.confirmerReinitialisation);

/**
 * @swagger
 * /api/auth/profil:
 *   get:
 *     summary: Obtenir profil utilisateur
 *     description: Obtenir le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profil', authentifierJWT, authController.obtenirProfil);

/**
 * @swagger
 * /api/auth/statut:
 *   get:
 *     summary: Obtenir statut utilisateur
 *     description: Obtenir le statut de l'utilisateur authentifié
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statut utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statut:
 *                   type: string
 *                   enum: [EN_ATTENTE, APPROUVE, REJETE]
 *                   example: "APPROUVE"
 *                 doit_changer_mot_passe:
 *                   type: boolean
 *                   example: false
 *                 a_soumis_formulaire:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/statut', authentifierJWT, authController.obtenirStatut);

/**
 * @swagger
 * /api/auth/deconnexion:
 *   post:
 *     summary: Déconnexion
 *     description: Déconnexion de l'utilisateur (logging côté serveur)
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Déconnexion réussie"
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/deconnexion', authentifierJWT, authController.seDeconnecter);

module.exports = router;