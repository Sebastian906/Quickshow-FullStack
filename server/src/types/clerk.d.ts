declare global {
    interface UserPublicMetadata {
        // Agrega campos públicos aquí si los necesitas
    }

    interface UserPrivateMetadata {
        favorites?: string[];
        role?: string;
    }
}

export { };