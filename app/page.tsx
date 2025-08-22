"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
    const { data: session } = useSession();

    if (!session) {
        return (
            <div>
                <h1>Não logado</h1>
                <button onClick={() => signIn("keycloak")}>
                    Login com Keycloak
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1>Logado como {session.user?.name}</h1>
            <p>Email: {session.user?.email}</p>
            <button onClick={() => signOut()}>Logout</button>
        </div>
    );
}
