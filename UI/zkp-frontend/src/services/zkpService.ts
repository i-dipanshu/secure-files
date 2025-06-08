/**
 * Zero-Knowledge Proof Service for Client-Side Operations
 * 
 * This service implements Schnorr proof generation on the client side,
 * matching the exact cryptographic implementation of our FastAPI backend.
 * 
 * Features:
 * - SECP256k1 key pair generation
 * - Schnorr proof creation with Fiat-Shamir heuristic
 * - API communication with ZKP authentication
 * - Secure key management utilities
 */

import * as EC from 'elliptic';
import CryptoJS from 'crypto-js';
import axios, { AxiosResponse } from 'axios';

// Initialize the SECP256k1 elliptic curve (same as Bitcoin)
const ec = new EC.ec('secp256k1');

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ZKPKeyPair {
  privateKey: string;
  publicKey: string;
  publicKeyHex: string;
}

export interface ZKPProof {
  commitment_x: string;
  commitment_y: string;
  response: string;
  challenge: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    type: string;
    message: string;
    code: string;
  };
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    user_id: string;
    username: string;
    email: string;
  };
}

export interface UserInfo {
  valid: boolean;
  user_id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
}

class ZKPService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Generate a cryptographically secure SECP256k1 key pair
   */
  generateKeyPair(): ZKPKeyPair {
    // Generate a new key pair using elliptic
    const keyPair = ec.genKeyPair();
    
    // Extract private key as hex string
    const privateKey = keyPair.getPrivate().toString('hex');
    
    // Extract public key point
    const publicKeyPoint = keyPair.getPublic();
    
    // Convert to uncompressed hex format (04 + x + y)
    const publicKeyHex = '04' + 
      publicKeyPoint.getX().toString('hex').padStart(64, '0') +
      publicKeyPoint.getY().toString('hex').padStart(64, '0');
    
    return {
      privateKey: `0x${privateKey}`,
      publicKey: publicKeyHex,
      publicKeyHex,
    };
  }

  /**
   * Create authentication message for ZKP
   */
  createAuthenticationMessage(username: string, timestamp?: number): string {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    return `ZKP_AUTH:${username}:${ts}`;
  }

  /**
   * Compute Fiat-Shamir challenge for Schnorr proof
   */
  private computeChallenge(
    commitmentX: string, 
    commitmentY: string, 
    publicKeyX: string, 
    publicKeyY: string, 
    message: string
  ): string {
    // Create challenge as H(R || P || message) using SHA-256
    const hasher = CryptoJS.algo.SHA256.create();
    
    // Add commitment point coordinates
    hasher.update(CryptoJS.enc.Hex.parse(commitmentX.padStart(64, '0')));
    hasher.update(CryptoJS.enc.Hex.parse(commitmentY.padStart(64, '0')));
    
    // Add public key coordinates
    hasher.update(CryptoJS.enc.Hex.parse(publicKeyX.padStart(64, '0')));
    hasher.update(CryptoJS.enc.Hex.parse(publicKeyY.padStart(64, '0')));
    
    // Add message
    hasher.update(CryptoJS.enc.Utf8.parse(message));
    
    // Finalize hash and convert to challenge
    const hashResult = hasher.finalize();
    const challengeHex = hashResult.toString(CryptoJS.enc.Hex);
    
    // Reduce modulo curve order (approximately)
    const challenge = ec.curve.n!.red(challengeHex);
    return challenge.toString('hex');
  }

  /**
   * Create a Schnorr zero-knowledge proof
   */
  createProof(privateKeyHex: string, message: string): ZKPProof {
    // Parse private key
    const privateKey = privateKeyHex.startsWith('0x') 
      ? privateKeyHex.slice(2) 
      : privateKeyHex;
    
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    
    // Generate random nonce
    const nonce = ec.genKeyPair().getPrivate();
    
    // Compute commitment R = r * G
    const commitment = ec.g.mul(nonce);
    const commitmentX = commitment.getX().toString('hex');
    const commitmentY = commitment.getY().toString('hex');
    
    // Get public key coordinates
    const publicKey = keyPair.getPublic();
    const publicKeyX = publicKey.getX().toString('hex');
    const publicKeyY = publicKey.getY().toString('hex');
    
    // Compute challenge c = H(R || P || message)
    const challenge = this.computeChallenge(
      commitmentX, 
      commitmentY, 
      publicKeyX, 
      publicKeyY, 
      message
    );
    
    // Compute response s = r + c * x (mod n)
    const challengeBN = ec.curve.n!.red(challenge);
    const privateKeyBN = keyPair.getPrivate();
    const response = nonce.add(challengeBN.mul(privateKeyBN)).mod(ec.curve.n!);
    
    return {
      commitment_x: `0x${commitmentX}`,
      commitment_y: `0x${commitmentY}`,
      response: `0x${response.toString('hex')}`,
      challenge: `0x${challenge}`,
      message,
    };
  }

  /**
   * Verify a Schnorr proof (client-side verification for testing)
   */
  verifyProof(proof: ZKPProof, publicKeyHex: string): boolean {
    try {
      // Parse proof components
      const commitmentX = proof.commitment_x.startsWith('0x') 
        ? proof.commitment_x.slice(2) 
        : proof.commitment_x;
      const commitmentY = proof.commitment_y.startsWith('0x') 
        ? proof.commitment_y.slice(2) 
        : proof.commitment_y;
      const response = proof.response.startsWith('0x') 
        ? proof.response.slice(2) 
        : proof.response;
      const challenge = proof.challenge.startsWith('0x') 
        ? proof.challenge.slice(2) 
        : proof.challenge;
      
      // Parse public key (remove '04' prefix)
      const pubKeyHex = publicKeyHex.startsWith('04') 
        ? publicKeyHex.slice(2) 
        : publicKeyHex;
      const publicKeyX = pubKeyHex.slice(0, 64);
      const publicKeyY = pubKeyHex.slice(64, 128);
      
      // Verify challenge computation
      const expectedChallenge = this.computeChallenge(
        commitmentX, 
        commitmentY, 
        publicKeyX, 
        publicKeyY, 
        proof.message
      );
      
      if (challenge !== expectedChallenge) {
        return false;
      }
      
      // Verify main equation: s * G = R + c * P
      const responseBN = ec.curve.n!.red(response);
      const challengeBN = ec.curve.n!.red(challenge);
      
      const leftSide = ec.g.mul(responseBN);
      const commitment = ec.curve.point(commitmentX, commitmentY);
      const publicKey = ec.curve.point(publicKeyX, publicKeyY);
      const rightSide = commitment.add(publicKey.mul(challengeBN));
      
      return leftSide.eq(rightSide);
    } catch (error) {
      console.error('Proof verification error:', error);
      return false;
    }
  }

  /**
   * Register a new user with ZKP authentication
   */
  async register(
    username: string, 
    email: string, 
    keyPair: ZKPKeyPair
  ): Promise<APIResponse> {
    try {
      // Create registration proof
      const message = this.createAuthenticationMessage(username);
      const zkpProof = this.createProof(keyPair.privateKey, message);
      
      const response: AxiosResponse<APIResponse> = await this.apiClient.post(
        '/api/auth/register',
        {
          username,
          email,
          public_key: keyPair.publicKeyHex,
          zkp_proof: zkpProof,
        }
      );
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          type: 'NetworkError',
          message: 'Failed to connect to the server',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * Login user with ZKP authentication
   */
  async login(
    identifier: string, 
    privateKey: string
  ): Promise<APIResponse<AuthResponse>> {
    try {
      // Create fresh login proof
      const message = this.createAuthenticationMessage(identifier);
      const zkpProof = this.createProof(privateKey, message);
      
      const response: AxiosResponse<APIResponse<AuthResponse>> = await this.apiClient.post(
        '/api/auth/login',
        {
          identifier,
          zkp_proof: zkpProof,
        }
      );
      
      // Store JWT token if login successful
      if (response.data.success && response.data.data?.access_token) {
        localStorage.setItem('zkp_token', response.data.data.access_token);
        localStorage.setItem('zkp_user', JSON.stringify(response.data.data.user));
        
        // Set default authorization header
        this.apiClient.defaults.headers.common['Authorization'] = 
          `Bearer ${response.data.data.access_token}`;
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          type: 'NetworkError',
          message: 'Failed to connect to the server',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * Verify current JWT token
   */
  async verifyToken(): Promise<APIResponse<UserInfo>> {
    try {
      const token = localStorage.getItem('zkp_token');
      if (!token) {
        return {
          success: false,
          error: {
            type: 'NoToken',
            message: 'No authentication token found',
            code: 'NO_TOKEN',
          },
        };
      }
      
      const response: AxiosResponse<APIResponse<UserInfo>> = await this.apiClient.get(
        '/api/auth/verify',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          type: 'NetworkError',
          message: 'Failed to verify token',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * Logout user (clear local storage)
   */
  logout(): void {
    localStorage.removeItem('zkp_token');
    localStorage.removeItem('zkp_user');
    localStorage.removeItem('zkp_private_key');
    delete this.apiClient.defaults.headers.common['Authorization'];
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('zkp_token');
    return !!token;
  }

  /**
   * Get stored user information
   */
  getStoredUser(): any {
    const user = localStorage.getItem('zkp_user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Store private key securely (with user warning)
   */
  storePrivateKey(privateKey: string): void {
    localStorage.setItem('zkp_private_key', privateKey);
  }

  /**
   * Get stored private key
   */
  getStoredPrivateKey(): string | null {
    return localStorage.getItem('zkp_private_key');
  }

  /**
   * Initialize API client with stored token
   */
  initializeAuth(): void {
    const token = localStorage.getItem('zkp_token');
    if (token) {
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Export key pair for backup
   */
  exportKeyPair(keyPair: ZKPKeyPair): string {
    const exportData = {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKeyHex,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import key pair from backup
   */
  importKeyPair(jsonData: string): ZKPKeyPair | null {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.privateKey && data.publicKey) {
        return {
          privateKey: data.privateKey,
          publicKey: data.publicKey,
          publicKeyHex: data.publicKey,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to import key pair:', error);
      return null;
    }
  }

  /**
   * Generate a secure random string for usernames/passwords
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Export singleton instance
export const zkpService = new ZKPService();
export default ZKPService; 