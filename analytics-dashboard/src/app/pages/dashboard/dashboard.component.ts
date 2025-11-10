import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Summary, UserActivity } from '../../models/analytics.models';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { AnalyticsService } from '../../services/analytics.service';
import { forkJoin } from 'rxjs';

import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  filters: Record<string, any> = {};
  summary: Summary | null = null;
  userActivity: UserActivity[] = [];
  loading = true;
  generating = false;
  showGeneratePanel = false;
  eventCount = 100;

  // Gráfico de barras para eventos por tipo
  eventsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Eventos',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };
  eventsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Eventos por Tipo',
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };
  eventsChartType = 'bar' as const;

  // Gráfico de dona para errores
  errorsChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 3,
        borderColor: '#ffffff',
      },
    ],
  };
  errorsChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { padding: 15, font: { size: 12 } },
      },
      title: {
        display: true,
        text: 'Distribución de Errores',
        font: { size: 16, weight: 'bold' },
      },
    },
  };
  errorsChartType = 'doughnut' as const;

  // Gráfico de línea para tendencias de score
  scoreChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Score Promedio',
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 3,
      },
    ],
  };
  scoreChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Tendencia de Score',
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        max: 100,
      },
      x: {
        grid: { display: false },
      },
    },
  };
  scoreChartType = 'line' as const;

  // Gráfico de polar area para dispositivos
  devicesChartData: ChartData<'polarArea'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(251, 146, 60, 0.7)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };
  devicesChartOptions: ChartOptions<'polarArea'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { padding: 15, font: { size: 12 } },
      },
      title: {
        display: true,
        text: 'Dispositivos',
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };
  devicesChartType = 'polarArea' as const;

  // NUEVO: Gráfico de barras horizontales para países
  countriesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Eventos por País',
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };
  countriesChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y', // Barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Distribución por País',
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { precision: 0 },
      },
      y: {
        grid: { display: false },
      },
    },
  };
  countriesChartType = 'bar' as const;

  // NUEVO: Gráfico de barras agrupadas para ejercicios
  exercisesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Intentos',
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        data: [],
        label: 'Errores',
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };
  exercisesChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { padding: 15, font: { size: 12 } },
      },
      title: {
        display: true,
        text: 'Top Ejercicios: Intentos vs Errores',
        font: { size: 16, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            if (context.dataset.label === 'Intentos') {
              const errors = this.exercisesChartData.datasets[1].data[context.dataIndex] as number;
              const attempts = context.parsed.y ?? 1;
              const errorRate = ((errors / attempts) * 100).toFixed(1);
              return `Tasa de error: ${errorRate}%`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { precision: 0 },
      },
      x: {
        grid: { display: false },
      },
    },
  };
  exercisesChartType = 'bar' as const;

  constructor(private svc: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;

    // Cargar todos los datos en paralelo
    forkJoin({
      summary: this.svc.getSummary(this.filters),
      events: this.svc.getEventsPerType(this.filters),
      errors: this.svc.getErrors(this.filters),
      scores: this.svc.getScoreTrends(this.filters),
      devices: this.svc.getDevices(this.filters),
      users: this.svc.getUserActivity(this.filters),
      countries: this.svc.getCountries(this.filters),
      exercises: this.svc.getTopExercises(this.filters),
    }).subscribe({
      next: (data) => {
        console.log('📊 Datos recibidos del backend:', data);

        // Summary
        this.summary = data.summary;
        console.log('📈 Summary:', this.summary);

        // Events Chart
        if (data.events && data.events.length > 0) {
          console.log('🔵 Procesando eventos:', data.events);
          this.eventsChartData = {
            labels: data.events.map((l) => this.formatEventType(l.event_type)),
            datasets: [
              {
                data: data.events.map((l) => l.total),
                label: 'Eventos',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderRadius: 8,
              },
            ],
          };
          console.log('✅ Events chart data actualizado:', this.eventsChartData);
        } else {
          console.warn('⚠️ No hay datos de eventos');
        }

        // Errors Chart
        if (data.errors && data.errors.length > 0) {
          console.log('🔴 Procesando errores:', data.errors);
          this.errorsChartData = {
            labels: data.errors.map((l) => this.formatErrorType(l.error_type)),
            datasets: [
              {
                data: data.errors.map((l) => l.total),
                backgroundColor: [
                  'rgba(239, 68, 68, 0.8)',
                  'rgba(249, 115, 22, 0.8)',
                  'rgba(245, 158, 11, 0.8)',
                  'rgba(139, 92, 246, 0.8)',
                  'rgba(236, 72, 153, 0.8)',
                ],
                borderWidth: 3,
                borderColor: '#ffffff',
              },
            ],
          };
          console.log('✅ Errors chart data actualizado:', this.errorsChartData);
        } else {
          console.warn('⚠️ No hay datos de errores');
        }

        // Score Trends Chart
        if (data.scores && data.scores.length > 0) {
          console.log('🟢 Procesando scores:', data.scores);
          this.scoreChartData = {
            labels: data.scores.map((p) => this.formatDate(p.date)),
            datasets: [
              {
                data: data.scores.map((p) => p.avg_score),
                label: 'Score Promedio',
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 3,
              },
            ],
          };
          console.log('✅ Score chart data actualizado:', this.scoreChartData);
        } else {
          console.warn('⚠️ No hay datos de scores');
        }

        // Devices Chart
        if (data.devices && data.devices.length > 0) {
          console.log('🟣 Procesando dispositivos:', data.devices);
          this.devicesChartData = {
            labels: data.devices.map((l) => this.formatDevice(l.device)),
            datasets: [
              {
                data: data.devices.map((l) => l.total),
                backgroundColor: [
                  'rgba(99, 102, 241, 0.7)',
                  'rgba(168, 85, 247, 0.7)',
                  'rgba(236, 72, 153, 0.7)',
                  'rgba(251, 146, 60, 0.7)',
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
              },
            ],
          };
          console.log('✅ Devices chart data actualizado:', this.devicesChartData);
        } else {
          console.warn('⚠️ No hay datos de dispositivos');
        }

        // NUEVO: Countries Chart
        if (data.countries && data.countries.length > 0) {
          console.log('🌎 Procesando países:', data.countries);
          this.countriesChartData = {
            labels: data.countries.map((c) => this.formatCountry(c.country)),
            datasets: [
              {
                data: data.countries.map((c) => c.total),
                label: 'Eventos por País',
                backgroundColor: [
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(251, 146, 60, 0.8)',
                  'rgba(168, 85, 247, 0.8)',
                ],
                borderColor: [
                  'rgba(34, 197, 94, 1)',
                  'rgba(59, 130, 246, 1)',
                  'rgba(251, 146, 60, 1)',
                  'rgba(168, 85, 247, 1)',
                ],
                borderWidth: 2,
                borderRadius: 6,
              },
            ],
          };
          console.log('✅ Countries chart data actualizado:', this.countriesChartData);
        } else {
          console.warn('⚠️ No hay datos de países');
        }

        // NUEVO: Exercises Chart
        if (data.exercises && data.exercises.length > 0) {
          console.log('📚 Procesando ejercicios:', data.exercises);
          this.exercisesChartData = {
            labels: data.exercises.map((e) => this.formatExerciseId(e.exercise_id)),
            datasets: [
              {
                data: data.exercises.map((e) => e.attempts),
                label: 'Intentos',
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                borderRadius: 6,
              },
              {
                data: data.exercises.map((e) => e.errors),
                label: 'Errores',
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                borderRadius: 6,
              },
            ],
          };
          console.log('✅ Exercises chart data actualizado:', this.exercisesChartData);
        } else {
          console.warn('⚠️ No hay datos de ejercicios');
        }

        // User Activity
        this.userActivity = data.users.slice(0, 10);
        console.log('👥 User activity:', this.userActivity);

        this.loading = false;
        console.log('✅ Carga completada');
      },
      error: (err) => {
        console.error('❌ Error cargando datos:', err);
        this.loading = false;
      },
    });
  }

  formatEventType(type: string): string {
    const types: Record<string, string> = {
      attempt: 'Intentos',
      error: 'Errores',
    };
    return types[type] || type;
  }

  formatErrorType(type: string | null): string {
    if (type === null) return 'Sin Error';

    const types: Record<string, string> = {
      timeout: 'Timeout',
      wrong_answer: 'Respuesta Incorrecta',
      grammar: 'Error de Gramática',
    };
    return types[type] || type;
  }

  formatDevice(device: string): string {
    const devices: Record<string, string> = {
      mobile: 'Móvil',
      tablet: 'Tablet',
      desktop: 'Escritorio',
    };
    return devices[device] || device;
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('es-ES');
  }

  formatDuration(seconds: number | undefined): string {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  formatCountry(country: string): string {
    const flags: Record<string, string> = {
      Argentina: '🇦🇷 Argentina',
      Uruguay: '🇺🇾 Uruguay',
      Chile: '🇨🇱 Chile',
      Paraguay: '🇵🇾 Paraguay',
    };
    return flags[country] || country;
  }

  formatExerciseId(id: string): string {
    return `Ejercicio ${id.replace('E', '')}`;
  }

  getActivityBarWidth(user: UserActivity): number {
    if (!this.userActivity || this.userActivity.length === 0 || !this.userActivity[0]) {
      return 0;
    }
    const maxEvents = this.userActivity[0].events;
    if (maxEvents === 0) return 0;
    return (user.events / maxEvents) * 100;
  }

  toggleGeneratePanel() {
    this.showGeneratePanel = !this.showGeneratePanel;
  }

  generateEvents() {
    if (this.eventCount <= 0 || this.eventCount > 10000) {
      alert('Por favor ingresa un número entre 1 y 10000');
      return;
    }

    this.generating = true;
    this.svc.generateEvents(this.eventCount).subscribe({
      next: (response) => {
        console.log('✅ Eventos generados:', response);
        this.generating = false;
        this.showGeneratePanel = false;
        // Recargar los datos del dashboard
        this.loadAll();
      },
      error: (err) => {
        console.error('❌ Error generando eventos:', err);
        this.generating = false;
        alert('Error al generar eventos');
      },
    });
  }
}
