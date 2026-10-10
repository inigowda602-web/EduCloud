import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin, LocateFixed, Loader2, Navigation } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import InteractiveMap from "../../components/InteractiveMap";
import { useToast } from "../../context/ToastContext";
import { usePersistentState } from "../../hooks/usePersistentState";
import { getCurrentPosition } from "../../services/geoUtils";
import { nextId } from "../../utils/idGenerator";
import { api } from "../../services/api";

const emptyForm = {
  name: "",
  room: "",
  latitude: "12.29581",
  longitude: "76.63929",
  radius: 50,
};

export default function AdminLocationManagement() {
  const [items, setItems] = usePersistentState("locations");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [locating, setLocating] = useState(false);
  const toast = useToast();

  // Load locations from backend if available
  useEffect(() => {
    let active = true;
    async function fetchBackendLocations() {
      try {
        const res = await api.get("/admin/locations");
        if (active && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((l) => ({
            id: l.id,
            name: l.name,
            room: l.room,
            latitude: l.latitude,
            longitude: l.longitude,
            radius: l.radiusMeters || 50,
          }));
          setItems(mapped);
        }
      } catch {
        // Silent fallback to persistent local storage
      }
    }
    fetchBackendLocations();
    return () => {
      active = false;
    };
  }, [setItems]);

  const activeLoc = (items || []).find((l) => l.id === selectedId) || (items && items[0]) || emptyForm;

  async function useMyLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const latStr = pos.latitude.toFixed(5);
      const lngStr = pos.longitude.toFixed(5);
      setForm((f) => ({ ...f, latitude: latStr, longitude: lngStr }));
      toast.success("Current device location captured.");
    } catch (err) {
      toast.error(err.message || "Couldn't get your current location.");
    } finally {
      setLocating(false);
    }
  }

  const filtered = (items || []).filter((l) =>
    (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.room || "").toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ...emptyForm,
      latitude: activeLoc?.latitude ? String(activeLoc.latitude) : "12.29581",
      longitude: activeLoc?.longitude ? String(activeLoc.longitude) : "76.63929",
    });
    setModalOpen(true);
  }

  function openEdit(l) {
    setEditing(l);
    setForm({
      name: l.name || "",
      room: l.room || "",
      latitude: String(l.latitude || "12.29581"),
      longitude: String(l.longitude || "76.63929"),
      radius: Number(l.radius || l.radiusMeters || 50),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.room.trim()) {
      toast.error("Location name and room are required.");
      return;
    }
    const latNum = parseFloat(form.latitude);
    const lngNum = parseFloat(form.longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Valid latitude and longitude are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      room: form.room.trim(),
      latitude: latNum,
      longitude: lngNum,
      radiusMeters: Number(form.radius) || 50,
    };

    if (editing) {
      // Try backend update if it's a numeric ID
      if (typeof editing.id === "number") {
        try {
          await api.put(`/admin/locations/${editing.id}`, payload);
        } catch {
          // Continue local update
        }
      }
      const updated = {
        ...form,
        id: editing.id,
        latitude: latNum,
        longitude: lngNum,
        radius: payload.radiusMeters,
      };
      setItems((prev) => prev.map((l) => (l.id === editing.id ? updated : l)));
      setSelectedId(updated.id);
      toast.success("Location updated successfully.");
    } else {
      let createdId = nextId(items, "LOC", { pad: 2 });
      try {
        const res = await api.post("/admin/locations", payload);
        if (res?.data?.id) createdId = res.data.id;
      } catch {
        // Continue with local ID
      }
      const created = {
        ...form,
        id: createdId,
        latitude: latNum,
        longitude: lngNum,
        radius: payload.radiusMeters,
      };
      setItems((prev) => [created, ...(prev || [])]);
      setSelectedId(created.id);
      toast.success("Location added successfully.");
    }
    setModalOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (typeof deleteTarget.id === "number") {
      try {
        await api.delete(`/admin/locations/${deleteTarget.id}`);
      } catch {
        // Fallback
      }
    }
    setItems((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    toast.success("Location removed.");
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Location Management"
        subtitle="Assign physical classroom coordinates and allowed radius for QR attendance"
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Location
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-5">
            <SearchBar value={search} onChange={setSearch} placeholder="Search locations or rooms..." />
          </div>
          <div className="card p-5">
            <DataTable
              columns={["Location", "Room", "Latitude", "Longitude", "Radius", "Actions"]}
              data={filtered}
              renderRow={(l) => {
                const isCurrent = activeLoc && activeLoc.id === l.id;
                return (
                  <>
                    <td
                      className="px-3 py-3 font-medium text-navy-800 cursor-pointer"
                      onClick={() => setSelectedId(l.id)}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className={isCurrent ? "text-cyan-600" : "text-navy-400"} />
                        <span>{l.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-navy-500 cursor-pointer" onClick={() => setSelectedId(l.id)}>{l.room}</td>
                    <td className="px-3 py-3 text-navy-500">{l.latitude}</td>
                    <td className="px-3 py-3 text-navy-500">{l.longitude}</td>
                    <td className="px-3 py-3 text-navy-500">{l.radius || l.radiusMeters || 50}m</td>
                    <td className="px-3 py-3 flex gap-1">
                      <button className="btn-ghost !py-1.5 !px-2" onClick={() => openEdit(l)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-ghost !py-1.5 !px-2 text-accent-coral"
                        onClick={() => setDeleteTarget(l)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </>
                );
              }}
            />
          </div>
        </div>

        {/* Live Interactive Map Preview Card */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-navy-900 flex items-center gap-1.5">
              <Navigation size={15} className="text-cyan-600" /> Live Interactive Map
            </p>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              Active Geofence
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden mb-4">
            <InteractiveMap
              latitude={activeLoc.latitude}
              longitude={activeLoc.longitude}
              radius={activeLoc.radius || activeLoc.radiusMeters || 50}
              name={activeLoc.name}
              room={activeLoc.room}
              height="300px"
            />
          </div>

          {activeLoc && (
            <div className="space-y-1.5 text-sm bg-navy-50/70 p-3.5 rounded-xl border border-navy-100">
              <p className="font-semibold text-navy-900">{activeLoc.name}</p>
              <p className="text-navy-600 text-xs">Room: {activeLoc.room}</p>
              <p className="text-navy-500 text-xs font-mono">
                Lat: {activeLoc.latitude} · Lng: {activeLoc.longitude}
              </p>
              <p className="text-cyan-700 text-xs font-medium">
                Geofence Radius: {activeLoc.radius || activeLoc.radiusMeters || 50} meters
              </p>
            </div>
          )}
          <p className="text-[11px] text-navy-400 mt-3 leading-relaxed">
            Attendance scans are validated against this exact GPS perimeter via the Haversine distance formula.
          </p>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Location" : "Add Location"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              {editing ? "Save Changes" : "Add Location"}
            </button>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Location Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Science Wing - Room 204"
            />
          </div>
          <div>
            <label className="label">Room / Hall</label>
            <input
              className="input"
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="e.g. Room 204"
            />
          </div>
          <div>
            <label className="label">Allowed Radius (meters)</label>
            <input
              type="number"
              className="input"
              value={form.radius}
              onChange={(e) => setForm((f) => ({ ...f, radius: Number(e.target.value) }))}
            />
          </div>

          {/* Interactive Picker Map */}
          <div className="sm:col-span-2">
            <label className="label flex items-center justify-between">
              <span>Interactive Location Picker</span>
              <span className="text-xs text-navy-400 font-normal">Click or search to position pin</span>
            </label>
            <InteractiveMap
              latitude={form.latitude}
              longitude={form.longitude}
              radius={form.radius}
              editable={true}
              onChange={({ latitude, longitude }) => setForm((f) => ({ ...f, latitude, longitude }))}
              height="220px"
            />
          </div>

          <div>
            <label className="label">Latitude</label>
            <input
              className="input"
              value={form.latitude}
              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              placeholder="e.g. 12.29588"
            />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input
              className="input"
              value={form.longitude}
              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              placeholder="e.g. 76.63941"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}{" "}
              {locating ? "Capturing current location..." : "Use My Current Device Location"}
            </button>
            <p className="text-xs text-navy-400 mt-1.5">
              Uses your device's high-accuracy GPS coordinates via navigator.geolocation.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove Location"
        message="Are you sure you want to remove this location? Attendance sessions using it will require reassignment."
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
