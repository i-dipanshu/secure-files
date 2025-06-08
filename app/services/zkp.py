"""
Zero-Knowledge Proof Service for Authentication.

This module implements Schnorr proofs for user authentication, providing
cryptographically secure zero-knowledge verification of private key ownership.

Schnorr Proof Protocol:
1. Prover has private key `x` and public key `P = x * G`
2. To prove knowledge of `x`:
   - Generate random nonce `r`
   - Compute commitment `R = r * G`
   - Compute challenge `c = H(R || P || message)`
   - Compute response `s = r + c * x`
   - Proof is (R, s)
3. Verifier checks: `s * G = R + c * P`
"""

import hashlib
import secrets
from typing import Dict, Any, Tuple, Optional
from dataclasses import dataclass

import structlog
from ecdsa import SECP256k1, ellipticcurve
from ecdsa.ellipticcurve import Point
from ecdsa.util import number_to_string, string_to_number

logger = structlog.get_logger(__name__)

# Curve parameters for SECP256k1
CURVE = SECP256k1
GENERATOR = CURVE.generator
ORDER = CURVE.order


@dataclass
class ZKPKeyPair:
    """ZKP key pair containing private and public keys."""
    private_key: int
    public_key: Point
    public_key_hex: str


@dataclass
class ZKPProofData:
    """ZKP proof structure for Schnorr proofs."""
    commitment_x: str  # R.x() as hex
    commitment_y: str  # R.y() as hex  
    response: str      # s as hex
    challenge: str     # c as hex
    message: str       # message that was signed


class ZKPService:
    """Zero-Knowledge Proof service implementing Schnorr proofs."""
    
    def __init__(self):
        self.curve = CURVE
        self.generator = GENERATOR
        self.order = ORDER
    
    def generate_keypair(self) -> ZKPKeyPair:
        """
        Generate a new ZKP key pair.
        
        Returns:
            ZKPKeyPair containing private key, public key point, and hex representation
        """
        # Generate random private key
        private_key = secrets.randbelow(self.order)
        
        # Compute public key P = x * G
        public_key = private_key * self.generator
        
        # Convert public key to hex representation
        public_key_hex = self._point_to_hex(public_key)
        
        logger.info("Generated new ZKP keypair", public_key=public_key_hex[:20] + "...")
        
        return ZKPKeyPair(
            private_key=private_key,
            public_key=public_key,
            public_key_hex=public_key_hex
        )
    
    def create_proof(self, private_key: int, message: str, challenge: Optional[str] = None) -> ZKPProofData:
        """
        Create a Schnorr proof of knowledge of private key.
        
        Args:
            private_key: The private key to prove knowledge of
            message: Message to include in the proof (e.g., username, timestamp)
            challenge: Optional pre-computed challenge (for testing)
            
        Returns:
            ZKPProofData containing the proof components
        """
        # Generate random nonce
        nonce = secrets.randbelow(self.order)
        
        # Compute commitment R = r * G
        commitment = nonce * self.generator
        
        # Compute public key P = x * G
        public_key = private_key * self.generator
        
        # Create challenge if not provided
        if challenge is None:
            challenge_hash = self._compute_challenge(commitment, public_key, message)
        else:
            challenge_hash = int(challenge, 16) if isinstance(challenge, str) else challenge
        
        # Compute response s = r + c * x (mod order)
        response = (nonce + challenge_hash * private_key) % self.order
        
        proof = ZKPProofData(
            commitment_x=hex(commitment.x()),
            commitment_y=hex(commitment.y()),
            response=hex(response),
            challenge=hex(challenge_hash),
            message=message
        )
        
        logger.info("Created ZKP proof", message=message, commitment_x=proof.commitment_x[:10] + "...")
        
        return proof
    
    def verify_proof(self, proof_data: ZKPProofData, public_key_hex: str) -> bool:
        """
        Verify a Schnorr proof.
        
        Args:
            proof_data: The proof to verify
            public_key_hex: Hex representation of the public key
            
        Returns:
            True if proof is valid, False otherwise
        """
        try:
            # Parse proof components
            commitment = Point(
                self.curve.curve,
                int(proof_data.commitment_x, 16),
                int(proof_data.commitment_y, 16),
                self.order
            )
            response = int(proof_data.response, 16)
            challenge = int(proof_data.challenge, 16)
            
            # Parse public key
            public_key = self._hex_to_point(public_key_hex)
            
            # Verify challenge is correctly computed
            expected_challenge = self._compute_challenge(commitment, public_key, proof_data.message)
            if challenge != expected_challenge:
                logger.warning("ZKP verification failed: invalid challenge")
                return False
            
            # Verify the main equation: s * G = R + c * P
            left_side = response * self.generator
            right_side = commitment + challenge * public_key
            
            if left_side.x() != right_side.x() or left_side.y() != right_side.y():
                logger.warning("ZKP verification failed: equation check failed")
                return False
            
            logger.info("ZKP proof verified successfully", message=proof_data.message)
            return True
            
        except Exception as e:
            logger.error("ZKP verification error", error=str(e))
            return False
    
    def _compute_challenge(self, commitment: Point, public_key: Point, message: str) -> int:
        """
        Compute the Fiat-Shamir challenge.
        
        Args:
            commitment: The commitment point R
            public_key: The public key point P
            message: The message being signed
            
        Returns:
            Challenge as integer
        """
        # Create challenge as H(R || P || message)
        hasher = hashlib.sha256()
        
        # Add commitment point
        hasher.update(number_to_string(commitment.x(), self.order))
        hasher.update(number_to_string(commitment.y(), self.order))
        
        # Add public key point
        hasher.update(number_to_string(public_key.x(), self.order))
        hasher.update(number_to_string(public_key.y(), self.order))
        
        # Add message
        hasher.update(message.encode('utf-8'))
        
        # Return challenge as integer
        challenge_bytes = hasher.digest()
        challenge = string_to_number(challenge_bytes) % self.order
        
        return challenge
    
    def _point_to_hex(self, point: Point) -> str:
        """
        Convert elliptic curve point to hex string representation.
        
        Args:
            point: Elliptic curve point
            
        Returns:
            Hex string representation (uncompressed format)
        """
        # Uncompressed point format: 0x04 || x || y
        x_bytes = number_to_string(point.x(), self.order)
        y_bytes = number_to_string(point.y(), self.order)
        
        # Pad to 32 bytes each
        x_hex = x_bytes.hex().zfill(64)
        y_hex = y_bytes.hex().zfill(64)
        
        return f"04{x_hex}{y_hex}"
    
    def _hex_to_point(self, hex_str: str) -> Point:
        """
        Convert hex string to elliptic curve point.
        
        Args:
            hex_str: Hex string representation of point
            
        Returns:
            Elliptic curve point
        """
        if not hex_str.startswith('04') or len(hex_str) != 130:
            raise ValueError("Invalid public key format")
        
        # Remove '04' prefix and split x, y coordinates
        coords = hex_str[2:]
        x_hex = coords[:64]
        y_hex = coords[64:]
        
        x = int(x_hex, 16)
        y = int(y_hex, 16)
        
        return Point(self.curve.curve, x, y, self.order)
    
    def create_authentication_message(self, username: str, timestamp: int) -> str:
        """
        Create a standard authentication message for proofs.
        
        Args:
            username: Username of the authenticating user
            timestamp: Unix timestamp of authentication attempt
            
        Returns:
            Formatted authentication message
        """
        return f"ZKP_AUTH:{username}:{timestamp}"
    
    def parse_legacy_proof(self, legacy_proof: Dict[str, Any]) -> Optional[ZKPProofData]:
        """
        Parse legacy proof format and convert to new format.
        
        Args:
            legacy_proof: Legacy proof in array format
            
        Returns:
            ZKPProofData if conversion successful, None otherwise
        """
        try:
            # Check if this is already new format
            if 'commitment_x' in legacy_proof:
                return ZKPProofData(**legacy_proof)
            
            # Try to parse legacy format
            proof_array = legacy_proof.get('proof', [])
            public_signals = legacy_proof.get('public_signals', [])
            
            if len(proof_array) >= 2 and len(public_signals) >= 2:
                # Convert legacy format to new format (this is a compatibility layer)
                # In real usage, clients should generate proper Schnorr proofs
                return ZKPProofData(
                    commitment_x=proof_array[0],
                    commitment_y=proof_array[1] if len(proof_array) > 1 else "0x0",
                    response=public_signals[0],
                    challenge=public_signals[1] if len(public_signals) > 1 else "0x0",
                    message="legacy_format"
                )
            
            return None
            
        except Exception as e:
            logger.error("Failed to parse legacy proof", error=str(e))
            return None


# Global ZKP service instance
zkp_service = ZKPService()


def create_demo_proof_for_user(username: str, public_key_hex: str) -> Dict[str, Any]:
    """
    Create a demo proof for testing purposes.
    
    This generates a valid Schnorr proof using a random private key
    that matches the given public key format.
    
    Args:
        username: Username for the proof
        public_key_hex: Public key in hex format
        
    Returns:
        Dictionary containing the proof in the expected format
    """
    # For demo purposes, generate a keypair and create a proof
    keypair = zkp_service.generate_keypair()
    
    # Create authentication message
    import time
    timestamp = int(time.time())
    message = zkp_service.create_authentication_message(username, timestamp)
    
    # Create the proof
    proof_data = zkp_service.create_proof(keypair.private_key, message)
    
    # Return in format expected by the API
    return {
        "commitment_x": proof_data.commitment_x,
        "commitment_y": proof_data.commitment_y,
        "response": proof_data.response,
        "challenge": proof_data.challenge,
        "message": proof_data.message,
        "public_key": keypair.public_key_hex  # Include the matching public key
    } 