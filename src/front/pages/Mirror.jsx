import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const getBackendUrl = () => {
  // Mantiene compatibilidad con tu setup (VITE_BACKEND_URL)
  const url = import.meta.env.VITE_BACKEND_URL;
  return (url || "").replace(/\/$/, "");
};

export const Mirror = () => {
  const BACKEND_URL = useMemo(() => getBackendUrl(), []);
  const token = useMemo(() => localStorage.getItem("pb_token"), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      if (!BACKEND_URL) {
        setError("Falta configurar VITE_BACKEND_URL.");
        setLoading(false);
        return;
      }

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${BACKEND_URL}/api/mirror/today`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = payload?.msg || payload?.message || "No se pudo cargar el Espejo.";
          throw new Error(msg);
        }

        setData(payload);
      } catch (e) {
        setError(e?.message || "Error inesperado cargando el Espejo.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [BACKEND_URL, token]);

  // UI helpers
  const sessions = data?.sessions || [];
  const activities = data?.activities || [];
  const pointsToday = data?.points_today ?? 0;
  const emotion = data?.emotion || null;
  const dateStr = data?.date || null;

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h2 fw-bold mb-1">Espejo</h1>
          <p className="text-secondary mb-0">
            {dateStr ? `Resumen de hoy (${dateStr})` : "Resumen de hoy"}
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/today">
            Volver a Hoy
          </Link>
          <Link className="btn btn-outline-secondary" to="/activities">
            Catálogo
          </Link>
        </div>
      </div>

      {!token && (
        <div className="alert alert-warning">
          <div className="fw-semibold mb-1">Necesitas iniciar sesión para ver tu Espejo.</div>
          <div className="d-flex gap-2 mt-2">
            <Link className="btn btn-primary" to="/auth/login">
              Ir a login
            </Link>
            <Link className="btn btn-outline-primary" to="/auth/signup">
              Crear cuenta
            </Link>
          </div>
        </div>
      )}

      {token && loading && (
        <div className="text-secondary">
          Cargando resumen...
        </div>
      )}

      {token && !loading && error && (
        <div className="alert alert-danger">
          <div className="fw-semibold">No se pudo cargar el Espejo</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      {token && !loading && !error && data && (
        <>
          {/* KPIs */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="text-secondary small">Puntos de hoy</div>
                  <div className="display-6 fw-bold">{pointsToday}</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="text-secondary small">Sesiones</div>
                  <div className="display-6 fw-bold">{sessions.length}</div>
                  <div className="text-secondary small">
                    {sessions.length
                      ? sessions.map((s) => s.session_type).join(" · ")
                      : "Sin sesiones registradas"}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="text-secondary small">Actividades completadas</div>
                  <div className="display-6 fw-bold">{activities.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Emotion */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h2 className="h5 fw-bold mb-0">Emoción (último registro)</h2>
                {emotion?.created_at && (
                  <span className="text-secondary small">{emotion.created_at}</span>
                )}
              </div>

              {!emotion && (
                <p className="text-secondary mb-0">Aún no hay emoción registrada hoy.</p>
              )}

              {emotion && (
                <>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge text-bg-dark">{emotion.name}</span>
                    {typeof emotion.value === "number" && (
                      <span className="text-secondary small">valor: {emotion.value}</span>
                    )}
                  </div>
                  {emotion.note ? (
                    <p className="mb-0">{emotion.note}</p>
                  ) : (
                    <p className="text-secondary mb-0">Sin nota.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Activities list */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h5 fw-bold mb-3">Actividades de hoy</h2>

              {!activities.length && (
                <p className="text-secondary mb-0">
                  Aún no has completado actividades hoy.
                </p>
              )}

              {!!activities.length && (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>Sesión</th>
                        <th className="text-end">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((a, idx) => (
                        <tr key={`${a.id}-${a.completed_at}-${idx}`}>
                          <td className="fw-semibold">{a.name}</td>
                          <td>
                            <span className="badge text-bg-secondary">
                              {a.session_type}
                            </span>
                          </td>
                          <td className="text-end">{a.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
